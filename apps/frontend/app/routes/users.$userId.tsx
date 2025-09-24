import type { Route } from "./+types/users.$userId";
import { Link, useLoaderData } from "react-router";
import { fetchUser, fetchUserSleeps, type User, type Sleep } from "../lib/api";
import { Badge, Box, Card, Container, Group, SimpleGrid, Text, Title, Button, Table } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

export async function loader({ params }: Route.LoaderArgs) {
  const userId = Number(params.userId)
  const user = await fetchUser(userId)
  // Initial load: fetch last 30 days as current window and the previous 30 days
  const end = dayjs()
  const start = end.subtract(29, 'day').startOf('day')
  const prevEnd = start.subtract(1, 'day').endOf('day')
  const prevStart = prevEnd.subtract(29, 'day').startOf('day')

  const [currentRes, prevRes] = await Promise.all([
    fetchUserSleeps(userId, { dateFrom: start.toISOString(), dateTo: end.toISOString(), page: 1, limit: 1000, sortBy: 'bedtime_full', sortOrder: 'asc' }),
    fetchUserSleeps(userId, { dateFrom: prevStart.toISOString(), dateTo: prevEnd.toISOString(), page: 1, limit: 1000, sortBy: 'bedtime_full', sortOrder: 'asc' }),
  ])

  const unwrap = (r: any) => Array.isArray(r) ? r : r?.data || []
  const current = unwrap(currentRes)
  const previous = unwrap(prevRes)
  return { user, current, previous } satisfies { user: User; current: Sleep[]; previous: Sleep[] }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data ? `${data.user.firstname} ${data.user.lastname}` : 'Patient' },
  ];
}

function formatMinutesToHHMM(totalMinutes: number): string {
  const m = Math.round(totalMinutes)
  const hh = Math.floor(m / 60)
  const mm = Math.abs(m % 60)
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
}

function toDay(s: string | null) {
  if (!s) return null
  const d = dayjs(s)
  return d.isValid() ? d : null
}

function averageOf(numbers: number[]): number | null {
  const vals = numbers.filter((n) => Number.isFinite(n))
  if (vals.length === 0) return null
  return vals.reduce((a,b)=>a+b,0) / vals.length
}

function meanMinutesOfDayFromDates(dates: (dayjs.Dayjs | null)[]): number | null {
  const angles: number[] = []
  for (const d of dates) {
    if (!d) continue
    const minutes = d.hour() * 60 + d.minute()
    const theta = (2 * Math.PI * minutes) / 1440
    angles.push(theta)
  }
  if (angles.length === 0) return null
  const x = averageOf(angles.map((t)=>Math.cos(t))) as number
  const y = averageOf(angles.map((t)=>Math.sin(t))) as number
  const thetaMean = Math.atan2(y, x)
  const minutesMean = ((thetaMean + 2*Math.PI) % (2*Math.PI)) * 1440 / (2*Math.PI)
  return minutesMean
}

function averageTimeOfDayFromDates(dates: (dayjs.Dayjs | null)[]): string | null {
  const minutes = meanMinutesOfDayFromDates(dates)
  return minutes == null ? null : formatMinutesToHHMM(minutes)
}

function computeKPIs(rows: Sleep[]) {
  const durations = rows.map((s) => s.duration_min ?? NaN).filter((n)=>Number.isFinite(n)) as number[]
  const meanDuration = durations.length ? averageOf(durations) : null

  const hrs = rows.map((s)=> s.mean_hr ?? NaN).filter((n)=>Number.isFinite(n)) as number[]
  const meanHr = hrs.length ? averageOf(hrs) : null

  const scores = rows.map((s)=> s.score ?? NaN).filter((n)=>Number.isFinite(n)) as number[]
  const meanScore = scores.length ? averageOf(scores) : null

  const bedDates = rows.map((s)=> toDay(s.bedtime_full))
  const wakeDates = rows.map((s)=> toDay(s.waketime_full))
  const meanBed = averageTimeOfDayFromDates(bedDates)
  const meanWake = averageTimeOfDayFromDates(wakeDates)
  const meanBedMin = meanMinutesOfDayFromDates(bedDates)
  const meanWakeMin = meanMinutesOfDayFromDates(wakeDates)

  return {
    count: rows.length,
    meanDuration,
    meanHr,
    meanScore,
    meanBed,
    meanWake,
    meanBedMin,
    meanWakeMin,
  }
}

function percentChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function circularMinutesDelta(currMin: number, prevMin: number): number {
  let diff = currMin - prevMin
  if (diff > 720) diff -= 1440
  if (diff < -720) diff += 1440
  return diff
}

function percentChangeCircular(currMin: number | null, prevMin: number | null): number | null {
  if (currMin == null || prevMin == null) return null
  const diff = circularMinutesDelta(currMin, prevMin)
  if (prevMin === 0) return null
  return (diff / Math.abs(prevMin)) * 100
}

function DeltaPct({ value, inverse = false }: { value: number | null, inverse?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <Text c="dimmed" size="sm">—</Text>
  const better = inverse ? value < 0 : value > 0
  const color = better ? 'teal' : 'red'
  const sign = value > 0 ? '+' : ''
  return <Text size="sm" c={color}>{sign}{Math.round(value)}%</Text>
}

export default function UserDetail() {
  const { user, current: initialCurrent, previous: initialPrevious } = useLoaderData() as { user: User; current: Sleep[]; previous: Sleep[] }

  const [daysRange, setDaysRange] = useState<number>(30)
  const [endDate, setEndDate] = useState<dayjs.Dayjs>(dayjs())
  const startDate = useMemo(() => endDate.subtract(daysRange - 1, 'day').startOf('day'), [endDate, daysRange])

  const [currentRows, setCurrentRows] = useState<Sleep[]>(initialCurrent)
  const [previousRows, setPreviousRows] = useState<Sleep[]>(initialPrevious)

  useEffect(() => {
    const userId = user.id
    const currentFrom = startDate.toISOString()
    const currentTo = endDate.toISOString()
    const prevEnd = startDate.subtract(1, 'day').endOf('day')
    const prevStart = prevEnd.subtract(daysRange - 1, 'day').startOf('day')

    Promise.all([
      fetchUserSleeps(userId, { dateFrom: currentFrom, dateTo: currentTo, page: 1, limit: 1000, sortBy: 'bedtime_full', sortOrder: 'asc' }),
      fetchUserSleeps(userId, { dateFrom: prevStart.toISOString(), dateTo: prevEnd.toISOString(), page: 1, limit: 1000, sortBy: 'bedtime_full', sortOrder: 'asc' }),
    ]).then(([cur, prev]) => {
      const unwrap = (r: any) => Array.isArray(r) ? r : r?.data || []
      setCurrentRows(unwrap(cur))
      setPreviousRows(unwrap(prev))
    }).catch(() => {
      // Silent fail for now
    })
  }, [user.id, startDate, endDate, daysRange])

  const current = useMemo(() => ({ ...computeKPIs(currentRows), rows: currentRows }), [currentRows])
  const previous = useMemo(() => ({ ...computeKPIs(previousRows), rows: previousRows }), [previousRows])

  const pctDuration = useMemo(() => percentChange(current.meanDuration, previous.meanDuration), [current, previous])
  const pctHr = useMemo(() => percentChange(current.meanHr, previous.meanHr), [current, previous])
  const pctScore = useMemo(() => percentChange(current.meanScore, previous.meanScore), [current, previous])
  const pctBed = useMemo(() => percentChangeCircular(current.meanBedMin ?? null, previous.meanBedMin ?? null), [current, previous])
  const pctWake = useMemo(() => percentChangeCircular(current.meanWakeMin ?? null, previous.meanWakeMin ?? null), [current, previous])

  function cellHighlight(opts: { value?: number | null, mean?: number | null, mode: 'higher-better' | 'lower-better', thresholdPct?: number }): boolean {
    const { value, mean, mode, thresholdPct = 20 } = opts
    if (value == null || mean == null) return false
    if (!Number.isFinite(value) || !Number.isFinite(mean) || mean === 0) return false
    const pct = ((value - mean) / Math.abs(mean)) * 100
    return mode === 'higher-better' ? pct < -thresholdPct : pct > thresholdPct
  }

  return (
    <Container size="lg" style={{ padding: 16 }}>
      <Group justify="space-between" align="center" mb="lg">
        <Button component={Link as any} to="/users" radius="xl">
          ← Retour
        </Button>
        <Title order={2} style={{
          background: 'linear-gradient(45deg, #2428a5, #9a3bcd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {user?.firstname} {user?.lastname}
        </Title>
        <div />
      </Group>

      <Group justify="space-between" align="center" mb="md" wrap="wrap">
        <Group align="center" gap="sm">
          <Text fw={600}>Période</Text>
          <Group gap="xs">
            <Button variant={daysRange===30? 'filled':'light'} radius="xl" onClick={()=> setDaysRange(30)}>30j</Button>
            <Button variant={daysRange===60? 'filled':'light'} radius="xl" onClick={()=> setDaysRange(60)}>60j</Button>
            <Button variant={daysRange===90? 'filled':'light'} radius="xl" onClick={()=> setDaysRange(90)}>90j</Button>
          </Group>
        </Group>
        <Group gap="xs">
          <Button radius="xl" onClick={()=> setEndDate((d)=> d.subtract(daysRange, 'day'))}>← Précédent</Button>
          <Button radius="xl" onClick={()=> setEndDate((d)=> d.add(daysRange, 'day'))}>Suivant →</Button>
        </Group>
        <Badge size="lg" variant="light" color="brand">{current.rows.length} nuits · {startDate.format('DD/MM/YYYY')} → {endDate.format('DD/MM/YYYY')}</Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md" mb="lg">
        <Card>
          <Text c="dimmed" size="sm">Durée moyenne</Text>
          <Title order={3}>{current.meanDuration != null ? `${formatMinutesToHHMM(current.meanDuration)}` : '—'}</Title>
          <Text c="dimmed" size="sm">vs {previous.meanDuration != null ? formatMinutesToHHMM(previous.meanDuration) : '—'} · <DeltaPct value={pctDuration} /></Text>
        </Card>
        <Card>
          <Text c="dimmed" size="sm">FC moyenne</Text>
          <Title order={3}>{current.meanHr != null ? `${Math.round(current.meanHr)} bpm` : '—'}</Title>
          <Text c="dimmed" size="sm">vs {previous.meanHr != null ? `${Math.round(previous.meanHr)} bpm` : '—'} · <DeltaPct value={pctHr} inverse /></Text>
        </Card>
        <Card>
          <Text c="dimmed" size="sm">Heure moyenne coucher</Text>
          <Title order={3}>{current.meanBed ?? '—'}</Title>
          <Text c="dimmed" size="sm">vs {previous.meanBed ?? '—'} · <DeltaPct value={pctBed} /></Text>
        </Card>
        <Card>
          <Text c="dimmed" size="sm">Heure moyenne lever</Text>
          <Title order={3}>{current.meanWake ?? '—'}</Title>
          <Text c="dimmed" size="sm">vs {previous.meanWake ?? '—'} · <DeltaPct value={pctWake} /></Text>
        </Card>
        <Card>
          <Text c="dimmed" size="sm">Score moyen</Text>
          <Title order={3}>{current.meanScore != null ? Math.round(current.meanScore) : '—'}</Title>
          <Text c="dimmed" size="sm">vs {previous.meanScore != null ? Math.round(previous.meanScore) : '—'} · <DeltaPct value={pctScore} /></Text>
        </Card>
      </SimpleGrid>

      <Title order={3} mt="xl" mb="sm">Données de sommeil</Title>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Caption>Légende: cellules surlignées en rouge = valeurs nettement moins bonnes que la moyenne de la période (ex: score ≪ moyenne, durée ≪ moyenne, FC ≫ moyenne).</Table.Caption>

        <Table.Thead bg="brand.0">
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Durée (min)</Table.Th>
            <Table.Th>FC moy.</Table.Th>
            <Table.Th>Coucher</Table.Th>
            <Table.Th>Lever</Table.Th>
            <Table.Th>Score</Table.Th>
            <Table.Th>Écart</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {current.rows.map((s) => {
            const durBad = cellHighlight({ value: s.duration_min ?? null, mean: current.meanDuration ?? null, mode: 'higher-better', thresholdPct: 20 })
            const hrBad = cellHighlight({ value: s.mean_hr ?? null, mean: current.meanHr ?? null, mode: 'lower-better', thresholdPct: 15 })
            const scoreBad = cellHighlight({ value: s.score ?? null, mean: current.meanScore ?? null, mode: 'higher-better', thresholdPct: 20 })
            const isRowBad = durBad || hrBad || scoreBad
            const durationPct = percentChange(s.duration_min ?? null, current.meanDuration ?? null)
            const hrPct = percentChange(s.mean_hr ?? null, current.meanHr ?? null)
            const scorePct = percentChange(s.score ?? null, current.meanScore ?? null)
            return (
              <Table.Tr key={s.id} bg={isRowBad ? 'red.0' : 'inherit'}>
                <Table.Td fw={isRowBad ? 'bolder' : 'inherit'} c={isRowBad ? 'red' : 'inherit'}>
                  {dayjs(s.bedtime_full || s.date).isValid() ? dayjs(s.bedtime_full || s.date).format('DD/MM/YYYY') : s.date}
                </Table.Td>
                <Table.Td fw={durBad ? 'bolder' : 'inherit'} c={durBad ? 'white' : 'inherit'} bg={durBad ? 'red.5' : 'transparent'}>{s.duration_min ?? '-'}</Table.Td>
                <Table.Td fw={hrBad ? 'bolder' : 'inherit'} c={hrBad ? 'white' : 'inherit'} bg={hrBad ? 'red.5' : 'transparent'}>{s.mean_hr ?? '-'}</Table.Td>
                <Table.Td>{s.bedtime_full ? dayjs(s.bedtime_full).format('HH:mm') : (s.bedtime ?? '-')}</Table.Td>
                <Table.Td>{s.waketime_full ? dayjs(s.waketime_full).format('HH:mm') : (s.waketime ?? '-')}</Table.Td>
                <Table.Td fw={scoreBad ? 'bolder' : 'inherit'} c={scoreBad ? 'white' : 'inherit'} bg={scoreBad ? 'red.5' : 'transparent'}>{s.score ?? '-'}</Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="wrap">
                    {durationPct != null && Number.isFinite(durationPct) && (
                      <Badge color={durationPct >= 0 ? 'teal' : 'red'} variant="light">Durée {durationPct > 0 ? '+' : ''}{Math.round(durationPct)}%</Badge>
                    )}
                    {hrPct != null && Number.isFinite(hrPct) && (
                      <Badge color={hrPct <= 0 ? 'teal' : 'red'} variant="light">FC {hrPct > 0 ? '+' : ''}{Math.round(hrPct)}%</Badge>
                    )}
                    {scorePct != null && Number.isFinite(scorePct) && (
                      <Badge color={scorePct >= 0 ? 'teal' : 'red'} variant="light">Score {scorePct > 0 ? '+' : ''}{Math.round(scorePct)}%</Badge>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Container>
  )
}

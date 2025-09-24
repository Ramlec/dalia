import type { Route } from "./+types/users";
import { Link, useLoaderData } from "react-router";
import { fetchUsers, type User } from "../lib/api";
import { useMemo, useState } from "react";
import { Avatar, Badge, Box, Card, Container, Group, Stack, Text, TextInput, Title, Button, rem } from "@mantine/core";

export async function loader() {
  const users = await fetchUsers();
  return { users } satisfies { users: User[] };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Utilisateurs" },
  ];
}

function getInitials(firstname?: string, lastname?: string) {
  const f = (firstname?.[0] || '').toUpperCase();
  const l = (lastname?.[0] || '').toUpperCase();
  return `${f}${l}` || '?'
}

export default function Users() {
  const { users } = useLoaderData() as { users: User[] };
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as User[];
    return users.filter((u) =>
      `${u.firstname} ${u.lastname}`.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <Container size="lg" style={{ padding: 16 }}>
      <Stack gap="xl">
        <Box>
          <Title order={2} mb="sm" style={{
            background: 'linear-gradient(45deg, #2428a5, #9a3bcd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Rechercher un utilisateur</Title>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Group align="center" gap="sm" wrap="nowrap">
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Tapez un nom ou prénom..."
                size="xl"
                radius="xl"
                style={{ flex: 1 }}
                autoFocus
              />
              <Button type="submit" size="xl" radius="xl">
                Rechercher
              </Button>
            </Group>
          </form>
          <Text c="dimmed" size="sm" mt="xs">
            Astuce: commencez à taper pour afficher les résultats.
          </Text>
        </Box>

        {query.trim().length === 0 ? (
          <Box mt="lg">
            <Card radius="md" p="xl" style={{
              background: 'linear-gradient(135deg, rgba(36,40,165,0.06), rgba(154,59,205,0.06))',
              borderColor: 'var(--mantine-color-brand-3)'
            }}>
              <Text c="dimmed">Aucun utilisateur affiché. Lancez une recherche pour voir des résultats.</Text>
            </Card>
          </Box>
        ) : (
          <Stack>
            {filtered.length === 0 ? (
              <Card radius="md" p="lg" style={{ borderColor: 'var(--mantine-color-brand-4)' }}>
                <Text>Aucun résultat pour « {query} »</Text>
              </Card>
            ) : (
              <Stack>
                {filtered.map((u) => (
                  <Card key={u.id} radius="md" p="md" style={{ borderColor: 'var(--mantine-color-brand-4)' }}>
                    <Group justify="space-between" align="center">
                      <Group align="center">
                        <Avatar radius="xl" size={48} color="brand">{getInitials(u.firstname, u.lastname)}</Avatar>
                        <Box>
                          <Text fw={600} size="lg">{u.firstname} {u.lastname}</Text>
                          <Group gap={6} mt={4}>
                            <Badge>ID {u.id}</Badge>
                          </Group>
                        </Box>
                      </Group>
                      <Button component={Link as any} to={`/users/${u.id}`} radius="md">
                        Voir le détail
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

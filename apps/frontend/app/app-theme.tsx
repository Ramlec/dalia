import {
  AppShell,
  Box,
  createTheme,
  DEFAULT_THEME,
  Group,
  Image,
  MantineProvider,
  type MantineProviderProps,
} from "@mantine/core";
import logo from '/logo.webp';

const brandScale = [
  '#f4f2ff', // 50
  '#e6e2ff', // 100
  '#cdc8ff', // 200
  '#b3abff', // 300
  '#9a90ff', // 400
  '#8075f4', // 500 (mix between #4b3f91 and lighter)
  '#6e5ae0', // 600
  '#5a47c9', // 700 ~ #4b3f91
  '#4a3bb0', // 800 ~ #2428a5 softened
  '#3a2f94', // 900 near #2428a5
];

export const appTheme = createTheme({
  colors: {
    brand: brandScale,
    violetX: [
      '#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87'
    ],
  },
  primaryColor: "brand",
  primaryShade: 7,
  components: {
    Button: {
      defaultProps: {
        variant: 'gradient',
        gradient: { from: '#2428a5', to: '#9a3bcd', deg: 45 },
        radius: 'xl',
      },
    },
    Badge: {
      defaultProps: {
        color: 'brand',
        variant: 'light',
        radius: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
      styles: {
        input: {
          borderColor: 'var(--mantine-color-brand-6)'
        },
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        radius: 'md',
      },
    },
    Avatar: {
      defaultProps: {
        color: 'brand',
      },
    },
  },
})

export function AppTheme({ children, theme = appTheme, ...props }: MantineProviderProps) {
  return (
    <MantineProvider theme={theme} {...props}>
      <AppShell padding="md"
        header={{ height: 60 }}
      >
        <AppShell.Header>
          <Box
            component="header"
            style={{
              position: 'relative',
              width: '100%',
              height: 60,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/background.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.9)',
              }}
            />

            <Group justify="space-between" align="center" style={{ position: 'relative', height: '100%' }}>
              <Group align="center" gap="xs">
                <Image src={logo} alt="Logo" h={48} width="auto" />
              </Group>
            </Group>
          </Box>
        </AppShell.Header>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </MantineProvider >
  )
}
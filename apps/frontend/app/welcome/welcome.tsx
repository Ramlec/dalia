import { Button, Card, Container, Flex, Image, List, NavLink, Stack, Text, Title } from "@mantine/core";

export function Welcome() {
  return (
    <Flex component='main' align='center' justify='center' pt='lg' pb='sm' h='100%'>
      <Flex direction='column' gap='xl' align='center'>
        <Title order={1} >Dalia Sleep Tracking</Title>
        <Stack gap='md'>
          <Button radius="xl" component="a" href="/users">Accéder à la liste des utilisateurs</Button>
        </Stack>
      </Flex>
    </Flex>
  );
}


import {
  Box,
  Card,
  Page,
  BlockStack,
  TextField,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function loader() {
  const settings = await prisma.settings.findFirst();
  return { settings };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const appName = formData.get("appName") as string;
  const appDescription = formData.get("appDescription") as string;

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { appName, appDescription },
    create: { id: 1, appName, appDescription: appDescription ?? "" },
  });

  return { ok: true, message: "Settings updated successfully" };
}

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const [formState, setFormState] = useState({
    appName: settings?.appName ?? "",
    appDescription: settings?.appDescription ?? "",
  });
  return (
    <Page>
      <TitleBar title="Settings" />
      <Card roundedAbove="sm">
        <Form method="post">
          <BlockStack gap="400">
            <TextField name="appName" label="App name" autoComplete="off" value={formState?.appName} onChange={(value) => setFormState({ ...formState, appName: value })} />
            <TextField name="appDescription" label="App description" autoComplete="off" value={formState?.appDescription} onChange={(value) => setFormState({ ...formState, appDescription: value })} />
            <Button submit>Save</Button>
          </BlockStack>
        </Form>
      </Card>
    </Page>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}

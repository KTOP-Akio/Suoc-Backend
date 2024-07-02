import { TOKEN_LENGTHS } from "@/lib/api/oauth";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "@/lib/zod";
import { authorizeSchema } from "@/lib/zod/schemas/oauth";
import { Background, Button, Footer, Nav } from "@dub/ui";
import { nanoid } from "@dub/utils";
import { TimerOff } from "lucide-react";
import { redirect } from "next/navigation";

// export const metadata = constructMetadata({
//   title: "Expired Link – Dub.co",
//   description:
//     "This link has expired. Please contact the owner of this link to get a new one.",
//   noIndex: true,
// });

export const runtime = "nodejs";

export default async function Authorize({
  searchParams,
}: {
  searchParams?: z.infer<typeof authorizeSchema>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const result = authorizeSchema.safeParse(searchParams);

  if (!result.success) {
    return result.error.message;
  }

  const { client_id, redirect_uri, response_type, state } = result.data;

  const app = await prisma.oAuthApp.findFirst({
    where: {
      clientId: client_id,
    },
  });

  if (!app) {
    return `Could not find OAuth client with clientId ${client_id}`;
  }

  // Validate
  if (app.redirectUri !== redirect_uri) {
    return "Invalid redirect_uri parameter for the application.";
  }

  const workspaces = await prisma.project.findMany({
    where: {
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });

  return (
    <main className="flex min-h-screen flex-col justify-between">
      <Nav />
      <div className="z-10 mx-2 my-10 flex max-w-md flex-col items-center space-y-5 px-2.5 text-center sm:mx-auto sm:max-w-lg sm:px-0 lg:mb-16">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gray-300 bg-white/30">
          <TimerOff className="h-6 w-6 text-gray-400" />
        </div>
        <h1 className="font-display text-5xl font-bold">{app.name}</h1>
        <p className="text-lg text-gray-600">{}</p>
        <form action={handleAuthorize}>
          <input type="hidden" name="client_id" value={client_id} />
          <input type="hidden" name="redirect_uri" value={redirect_uri} />
          <input type="hidden" name="response_type" value={response_type} />
          <input type="hidden" name="state" value={state} />

          <select name="workspace_id">
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                <div>
                  <img
                    src={workspace.logo!}
                    className="h-8 w-8 rounded-full"
                    alt=""
                  />
                  {workspace.name}
                </div>
              </option>
            ))}
          </select>
          <Button
            text={`Authorize ${app.name}`}
            type="submit"
            // loading={clickedGithub}
            // icon={<Github className="h-4 w-4" />}
          />
        </form>
      </div>
      <Footer />
      <Background />
    </main>
  );
}

// Server action to create OAuth app
const handleAuthorize = async (formData: FormData) => {
  "use server";

  const session = await getSession();

  if (!session) {
    return redirect("/login");
  }

  const { client_id, redirect_uri, response_type, state, workspace_id } =
    authorizeSchema
      .merge(
        z.object({
          workspace_id: z.string(),
        }),
      )
      .parse(Object.fromEntries(formData));

  const { code } = await prisma.oAuthCode.create({
    data: {
      clientId: client_id,
      projectId: workspace_id,
      redirectUri: redirect_uri,
      userId: session.user.id,
      scopes: "",
      code: nanoid(TOKEN_LENGTHS.code),
      expiresAt: new Date(),
    },
  });

  const searchParams = new URLSearchParams({
    code,
    ...(state && { state }),
  });

  return redirect(`${redirect_uri}?${searchParams.toString()}`);
};

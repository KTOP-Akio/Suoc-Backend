import { scopeDescriptions as allScopes } from "@/lib/api/tokens/scopes";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  BlurImage,
  Button,
  ButtonProps,
  InfoTooltip,
  Label,
  Logo,
  Modal,
  RadioGroup,
  RadioGroupItem,
} from "@dub/ui";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

// TODO:
// Fetch the scopes from the API

type APIKeyProps = {
  id?: string;
  name: string;
  scopes: { [key: string]: string };
  isMachine: boolean;
};

const newToken: APIKeyProps = {
  name: "",
  scopes: {},
  isMachine: false,
};

function AddEditTokenModal({
  showAddEditTokenModal,
  setShowAddEditTokenModal,
  props,
  onTokenCreated,
}: {
  showAddEditTokenModal: boolean;
  setShowAddEditTokenModal: Dispatch<SetStateAction<boolean>>;
  props?: APIKeyProps;
  onTokenCreated: (token: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { id: workspaceId, logo, slug } = useWorkspace();
  const [data, setData] = useState<APIKeyProps>(props || newToken);

  // Determine the endpoint
  const endpoint = useMemo(() => {
    if (props) {
      return {
        method: "PATCH",
        url: `/api/tokens/${"id"}?workspaceId=${workspaceId}`,
        successMessage: "API key updated!",
      };
    } else {
      return {
        method: "POST",
        url: `/api/tokens?workspaceId=${workspaceId}`,
        successMessage: "API key created!",
      };
    }
  }, [props]);

  // Save the form data
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        scopes: Object.values(scopes).filter((v) => v),
      }),
    });

    const result = await response.json();

    if (response.ok) {
      mutate(`/api/tokens?workspaceId=${workspaceId}`);
      toast.success(endpoint.successMessage);
      onTokenCreated(result.token);
      setShowAddEditTokenModal(false);
    } else {
      toast.error(result.error.message);
    }
  };

  const { name, scopes, isMachine } = data;
  const buttonDisabled = !name;

  return (
    <>
      <Modal
        showModal={showAddEditTokenModal}
        setShowModal={setShowAddEditTokenModal}
        className="scrollbar-hide h-fit max-h-[95vh] overflow-auto"
      >
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-4 pt-8 sm:px-16">
          {logo ? (
            <BlurImage
              src={logo}
              alt={`Logo for ${slug}`}
              className="h-10 w-10 rounded-full border border-gray-200"
              width={20}
              height={20}
            />
          ) : (
            <Logo />
          )}
          <h1 className="text-lg font-medium">
            {props ? "Edit" : "Add New"} API Key
          </h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 text-left sm:px-10"
        >
          <div>
            <RadioGroup
              className="flex"
              defaultValue="user"
              required
              onValueChange={(value) =>
                setData({ ...data, isMachine: value === "machine" })
              }
            >
              <div className="flex w-1/2 items-center space-x-2 rounded-md border border-gray-300 bg-white transition-all hover:bg-gray-50 active:bg-gray-100">
                <RadioGroupItem value="user" id="user" className="ml-3" />
                <Label
                  htmlFor="user"
                  className="flex flex-1 cursor-pointer items-center justify-between space-x-1 p-3 pl-0"
                >
                  <p className="text-gray-600">You</p>
                  <InfoTooltip content="This API key is tied to your user and can make requests against the selected workspace. If you are removed from the workspace, this key will be disabled." />
                </Label>
              </div>
              <div className="flex w-1/2 items-center space-x-2 rounded-md border border-gray-300 bg-white transition-all hover:bg-gray-50 active:bg-gray-100">
                <RadioGroupItem value="machine" id="machine" className="ml-3" />
                <Label
                  htmlFor="machine"
                  className="flex flex-1 cursor-pointer items-center justify-between space-x-1 p-3 pl-0"
                >
                  <p className="text-gray-600">Machine</p>
                  <InfoTooltip content="A new bot member will be added to your workspace, and an API key will be created. Since this are not tied to a user, you can enusre that API key remains active even if you leave the workspace." />
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label htmlFor="name" className="flex items-center space-x-2">
              <h2 className="text-sm font-medium text-gray-900">Name</h2>
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                name="target"
                id="target"
                className="block w-full rounded-md border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
                placeholder="My Test Key"
                required
                value={name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
            </div>
          </div>

          <span className="text-sm text-gray-500">
            Choose the permissions for this API key. These permissions apply
            when the API key is used to make requests to Dub.
          </span>

          <div className="flex flex-col divide-y text-sm">
            {allScopes.map((scope) => (
              <div
                className="flex items-center justify-between py-4"
                key={`${scope.resource}-resource`}
              >
                <div className="flex gap-1 text-gray-500">
                  <p>{scope.resource}</p>
                  <InfoTooltip content={scope.description} />
                </div>
                <div>
                  <RadioGroup
                    defaultValue=""
                    className="flex gap-4"
                    onValueChange={(v) => {
                      setData({
                        ...data,
                        scopes: {
                          ...scopes,
                          [scope.resource.toLocaleLowerCase()]: v,
                        },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="" />
                      <div>None</div>
                    </div>
                    {scope.permissions.map((permission) => (
                      <div
                        className="flex items-center space-x-2"
                        key={permission.scope}
                      >
                        <RadioGroupItem value={permission.scope} />
                        <div>{permission.permission}</div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>

          <Button
            text={props ? "Save changes" : "Create API key"}
            disabled={buttonDisabled}
            loading={saving}
          />
        </form>
      </Modal>
    </>
  );
}

function AddTokenButton({
  setShowAddEditTokenModal,
  buttonProps,
}: {
  setShowAddEditTokenModal: Dispatch<SetStateAction<boolean>>;
  buttonProps?: Partial<ButtonProps>;
}) {
  return (
    <div>
      <Button
        text="New API Key"
        onClick={() => setShowAddEditTokenModal(true)}
        className="w-36"
        {...buttonProps}
      />
    </div>
  );
}

export function useAddEditTokenModal(
  {
    props,
    onTokenCreated,
  }: {
    props?: APIKeyProps;
    onTokenCreated: (token: string) => void;
  } = { onTokenCreated: () => {} },
) {
  const [showAddEditTokenModal, setShowAddEditTokenModal] = useState(false);

  const AddEditTokenModalCallback = useCallback(() => {
    return (
      <AddEditTokenModal
        showAddEditTokenModal={showAddEditTokenModal}
        setShowAddEditTokenModal={setShowAddEditTokenModal}
        props={props}
        onTokenCreated={onTokenCreated}
      />
    );
  }, [showAddEditTokenModal, setShowAddEditTokenModal]);

  const AddTokenButtonCallback = useCallback(() => {
    return (
      <AddTokenButton setShowAddEditTokenModal={setShowAddEditTokenModal} />
    );
  }, [setShowAddEditTokenModal]);

  return useMemo(
    () => ({
      setShowAddEditTokenModal,
      AddEditTokenModal: AddEditTokenModalCallback,
      AddTokenButton: AddTokenButtonCallback,
    }),
    [
      setShowAddEditTokenModal,
      AddEditTokenModalCallback,
      AddTokenButtonCallback,
    ],
  );
}

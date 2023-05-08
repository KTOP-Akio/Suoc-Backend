import Stats from "#/ui/stats";
import Modal from "#/ui/modal";

export default function StatsModal({ params }: { params: { key: string } }) {
  return (
    <Modal bgColor="bg-gray-50">
      <div
        className="inline-block max-h-[calc(100vh-150px)] w-full max-w-screen-xl transform overflow-scroll bg-gray-50
        align-middle shadow-xl scrollbar-hide sm:rounded-2xl sm:border sm:border-gray-200"
      >
        <Stats staticDomain="dub.sh" staticKey={params.key} />
      </div>
    </Modal>
  );
}

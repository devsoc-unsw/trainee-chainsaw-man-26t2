import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { SyntheticEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign } from "@/lib/api";
import { Card } from "@/components/Card";
import { Field, TextArea } from "@/components/Form";

// TODO: delete between TODO once dates made optional
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// TODO

const pillClass =
  "rounded-full bg-emphasis px-4 py-2 text-sm font-medium text-muted";

export function NewElectionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={pillClass}
      >
        New Election
      </button>
      <NewElectionPopUp
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

function NewElectionPopUp({ open, onClose }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const queryClient = useQueryClient();
  const createElection = useMutation({
    mutationFn: createCampaign,
    onSuccess: ({ campaign_id }) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      onClose();
      navigate({ to: "/elections/$electionId", params: { electionId: campaign_id } });
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setShowErrors(false);
      
      createElection.reset();
    }
  }, [open]);

  const errors = {
    title: title.trim() ? undefined : "Enter a name for this election",
    description: description.trim() ? undefined : "Add a short description",
  };
  const isValid = !errors.title && !errors.description;

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (!isValid || createElection.isPending) return;

    createElection.mutate({
      title: title.trim(),
      description: description.trim(),
      allow_role_overlaps: false,
      // TODO: delete between TODO once dates made optional
      opening_date_time: new Date(Date.now() + HOUR).toISOString(),
      closing_date_time: new Date(Date.now() + 7 * DAY).toISOString(),
      // TODO
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-election-heading"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] bg-transparent p-0 backdrop:bg-black/50"
    >
      <Card className="p-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <h2 id="new-election-heading" className="text-sm font-medium">
            New election
          </h2>

          <Field
            label="Title"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            placeholder="Input Field"
            maxLength={50}
            hint={`${title.length}/50`}
            error={showErrors ? errors.title : undefined}
          />

          <TextArea
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            rows={3}
            maxLength={200}
            hint={`${description.length}/200`}
            placeholder="What this election is for and who can vote."
            error={showErrors ? errors.description : undefined}
          />

          {/* request failed, but not a field error */}
          {createElection.isError && (
            <p role="alert" className="text-xs text-red-600">
              {createElection.error.message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createElection.isPending}
              className={`${pillClass} disabled:opacity-60`}
            >
              {createElection.isPending ? "Creating…" : "Create election"}
            </button>
          </div>
        </form>
      </Card>
    </dialog>
  );
}

"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BusinessManager } from "../domain/entities";
import type {
  CreateBusinessManagerDto,
  UpdateBusinessManagerDto,
} from "../application/dto";

type DialogState = "form" | "submitting" | "success" | "error";

interface BmFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateBusinessManagerDto | UpdateBusinessManagerDto
  ) => Promise<void>;
  onFetchName: (bmId: string, accessToken: string) => Promise<string | null>;
  editingBm?: BusinessManager | null;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-neon ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-9 bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40 ${
            error ? "border-red-500/50 focus-visible:ring-red-500/30" : ""
          }`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function SubmittingState({ isEditing }: { isEditing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-neon/20" />
        <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-neon" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isEditing ? "Saving changes..." : "Adding Business Manager..."}
        </p>
        <p className="text-xs text-muted-foreground">
          Validating credentials and connecting to Meta API
        </p>
      </div>
    </div>
  );
}

function SuccessState({
  bmName,
  isEditing,
  onClose,
}: {
  bmName: string | null;
  isEditing: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neon/10">
        <CheckCircle2 className="h-8 w-8 text-neon" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isEditing ? "Changes saved!" : "Business Manager added!"}
        </p>
        {bmName && (
          <p className="text-xs text-neon">{bmName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {isEditing
            ? "Your Business Manager was updated successfully."
            : "Your Business Manager is ready to use."}
        </p>
      </div>
      <Button
        onClick={onClose}
        className="mt-2 bg-neon text-black font-medium hover:bg-neon-hover"
      >
        Done
      </Button>
    </div>
  );
}

function ErrorState({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <XCircle className="h-8 w-8 text-red-400" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          Something went wrong
        </p>
        <p className="text-xs text-red-400 max-w-xs">
          {errorMessage}
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-2 border-white/[0.08] text-foreground hover:border-neon/30"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}

interface FieldErrors {
  bmId?: string;
  userToken?: string;
  appId?: string;
  appSecret?: string;
}

function validateFields(
  bmId: string,
  userToken: string,
  appId: string,
  appSecret: string
): FieldErrors | null {
  const errors: FieldErrors = {};

  if (!bmId.trim()) {
    errors.bmId = "Business Manager ID is required";
  } else if (!/^\d+$/.test(bmId.trim())) {
    errors.bmId = "BM ID must contain only numbers";
  }

  if (!userToken.trim()) {
    errors.userToken = "User Token is required";
  }

  if (!appId.trim()) {
    errors.appId = "App ID is required";
  }

  if (!appSecret.trim()) {
    errors.appSecret = "App Secret is required";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

interface BmFormBodyProps {
  editingBm: BusinessManager | null | undefined;
  onSubmit: (
    data: CreateBusinessManagerDto | UpdateBusinessManagerDto
  ) => Promise<void>;
  onFetchName: (bmId: string, accessToken: string) => Promise<string | null>;
  onClose: () => void;
}

function BmFormBody({
  editingBm,
  onSubmit,
  onFetchName,
  onClose,
}: BmFormBodyProps) {
  const [bmId, setBmId] = useState(editingBm?.bmId ?? "");
  const [bmName, setBmName] = useState<string | null>(
    editingBm?.bmName ?? null
  );
  const [userToken, setUserToken] = useState(editingBm?.userToken ?? "");
  const [systemToken, setSystemToken] = useState(
    editingBm?.systemToken ?? ""
  );
  const [appId, setAppId] = useState(editingBm?.appId ?? "");
  const [appSecret, setAppSecret] = useState(editingBm?.appSecret ?? "");
  const [autoRenew, setAutoRenew] = useState(editingBm?.autoRenew ?? false);

  const [dialogState, setDialogState] = useState<DialogState>("form");
  const [isFetchingName, setIsFetchingName] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = !!editingBm;

  async function handleFetchName() {
    if (!bmId || !userToken) return;
    setIsFetchingName(true);
    const name = await onFetchName(bmId, userToken);
    setBmName(name);
    setIsFetchingName(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateFields(bmId, userToken, appId, appSecret);
    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setDialogState("submitting");

    try {
      const data = {
        bmId: bmId.trim(),
        userToken: userToken.trim(),
        systemToken: systemToken.trim() || null,
        appId: appId.trim(),
        appSecret: appSecret.trim(),
        autoRenew,
      };

      await onSubmit(data);
      setDialogState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save Business Manager"
      );
      setDialogState("error");
    }
  }

  if (dialogState === "submitting") {
    return <SubmittingState isEditing={isEditing} />;
  }

  if (dialogState === "success") {
    return (
      <SuccessState bmName={bmName ?? bmId} isEditing={isEditing} onClose={onClose} />
    );
  }

  if (dialogState === "error") {
    return (
      <ErrorState
        errorMessage={errorMessage}
        onRetry={() => setDialogState("form")}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* BM ID + Name Fetch */}
      <div className="space-y-1.5">
        <Label htmlFor="bmId" className="text-xs text-muted-foreground">
          Business Manager ID <span className="text-neon">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="bmId"
            value={bmId}
            onChange={(e) => {
              setBmId(e.target.value);
              if (fieldErrors.bmId) {
                setFieldErrors((prev) => ({ ...prev, bmId: undefined }));
              }
            }}
            placeholder="e.g. 123456789012345"
            className={`bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40 ${
              fieldErrors.bmId
                ? "border-red-500/50 focus-visible:ring-red-500/30"
                : ""
            }`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleFetchName}
            disabled={!bmId || !userToken || isFetchingName}
            className="shrink-0 border-white/[0.08] hover:border-neon/30 hover:text-neon"
          >
            {isFetchingName ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {fieldErrors.bmId && (
          <p className="text-[11px] text-red-400">{fieldErrors.bmId}</p>
        )}
        {bmName && <p className="text-xs text-neon">{bmName}</p>}
      </div>

      <PasswordField
        id="userToken"
        label="User Token"
        value={userToken}
        onChange={(val) => {
          setUserToken(val);
          if (fieldErrors.userToken) {
            setFieldErrors((prev) => ({ ...prev, userToken: undefined }));
          }
        }}
        placeholder="Paste your user access token"
        required
        error={fieldErrors.userToken}
      />

      <PasswordField
        id="systemToken"
        label="System Token"
        value={systemToken}
        onChange={setSystemToken}
        placeholder="Optional — system user token"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="appId" className="text-xs text-muted-foreground">
            App ID <span className="text-neon">*</span>
          </Label>
          <Input
            id="appId"
            value={appId}
            onChange={(e) => {
              setAppId(e.target.value);
              if (fieldErrors.appId) {
                setFieldErrors((prev) => ({ ...prev, appId: undefined }));
              }
            }}
            placeholder="App ID"
            className={`bg-white/[0.03] border-white/[0.08] text-sm focus-visible:ring-neon/30 focus-visible:border-neon/40 ${
              fieldErrors.appId
                ? "border-red-500/50 focus-visible:ring-red-500/30"
                : ""
            }`}
          />
          {fieldErrors.appId && (
            <p className="text-[11px] text-red-400">{fieldErrors.appId}</p>
          )}
        </div>

        <PasswordField
          id="appSecret"
          label="App Secret"
          value={appSecret}
          onChange={(val) => {
            setAppSecret(val);
            if (fieldErrors.appSecret) {
              setFieldErrors((prev) => ({ ...prev, appSecret: undefined }));
            }
          }}
          placeholder="App Secret"
          required
          error={fieldErrors.appSecret}
        />
      </div>

      {/* Auto-renew toggle */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Auto-renew token
          </p>
          <p className="text-xs text-muted-foreground">
            Exchange for long-lived token on save
          </p>
        </div>
        <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-neon text-black font-medium hover:bg-neon-hover"
        >
          {isEditing ? "Save Changes" : "Add BM"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BmFormDialog({
  isOpen,
  onClose,
  onSubmit,
  onFetchName,
  editingBm,
}: BmFormDialogProps) {
  const formKey = editingBm?.id ?? "new";
  const isEditing = !!editingBm;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="bg-[oklch(0.15_0_0)] border-white/[0.08] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {isEditing ? "Edit Business Manager" : "Add Business Manager"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Update your Business Manager credentials."
              : "Enter your Meta Business Manager credentials to get started."}
          </DialogDescription>
        </DialogHeader>

        <BmFormBody
          key={formKey}
          editingBm={editingBm}
          onSubmit={onSubmit}
          onFetchName={onFetchName}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

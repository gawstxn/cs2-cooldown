import type { Account } from "@/lib/cooldown/types";
import type { AccountView } from "@/lib/cooldown/derive";

export type TabId = "overview" | "accounts" | "stats" | "weekly";

/** Everything a tab can ask the app shell to do. */
export interface AppActions {
  goTab: (tab: TabId, accountId?: string) => void;
  openAddAccount: () => void;
  openEditAccount: (account: Account) => void;
  openLog: (accountId?: string) => void;
  askCancelCooldown: (view: AccountView) => void;
  askRemoveAccount: (account: Account) => void;
  toggleWeekly: (accountId: string, key: "drop" | "level") => void;
  openResetSettings: () => void;
}

export const TAG_LABEL: Record<Account["tag"], string> = {
  Main: "Main",
  Smurf: "Smurf",
  Alt: "Alt",
};

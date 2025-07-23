"use client";

import { useEffect } from "react";
import { Dropdown } from "flowbite-react";
import { ChevronDownIcon, DeviceTabletIcon } from "@heroicons/react/24/outline";
import { useKindleEmail } from "~/app/_contexts/KindleEmailContext";

export default function KindleEmailSelector() {
  const {
    selectedKindleEmail,
    setSelectedKindleEmail,
    availableKindleEmails,
    refreshKindleEmails,
  } = useKindleEmail();

  useEffect(() => {
    void refreshKindleEmails();
  }, [refreshKindleEmails]);

  if (availableKindleEmails.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center border-r-2 border-slate-800 pr-8">
      <DeviceTabletIcon className="mr-2 h-4 w-4 text-slate-400" />
      <Dropdown
        label=""
        dismissOnClick={true}
        renderTrigger={() => (
          <button className="flex items-center text-sm text-slate-200 hover:text-slate-100">
            <span className="mr-1">
              {selectedKindleEmail
                ? `${selectedKindleEmail.name ?? selectedKindleEmail.email} (${selectedKindleEmail.kindleEmail})`
                : "Select Kindle Email"}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
      >
        {availableKindleEmails.map((user) => (
          <Dropdown.Item
            key={user.email}
            onClick={() => setSelectedKindleEmail(user)}
          >
            <div className="flex w-full flex-col">
              <div className="text-left text-sm font-medium">
                {user.name ?? user.email}
              </div>
              <div className="text-left text-xs text-slate-500">
                {user.kindleEmail}
              </div>
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown>
    </div>
  );
}

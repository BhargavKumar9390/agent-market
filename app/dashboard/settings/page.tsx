"use client";

import { Card, Button, Input, TextField, InputGroup, Separator, Chip, Switch, Label, Alert, Tabs, TextArea, Description, AlertDialog } from "@heroui/react";
import React, { useState } from "react";

export default function SettingsPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    bio: "AI Enthusiast and Automation Expert."
  });

  const handleUpdate = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const [preferences, setPreferences] = useState({
    email: true,
    desktop: true
  });

  const handleDelete = () => {
    alert("Account deletion initiated. You will be logged out.");
  };

  const dangerZone = (
    <Card className="bg-surface border border-divider p-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold text-danger">Danger zone</h2>
        <p className="text-default-900">Delete user account</p>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <p className="text-sm text-default-500 leading-relaxed max-w-2xl">
          By deleting your account you will lose all your data and access to any workspaces that you are associated with.
        </p>
        <AlertDialog>
          <Button
            variant="danger"
            className="w-full md:w-fit font-bold px-8 h-12"
          >
            Request account deletion
          </Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-[400px]">
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading className="text-foreground">Delete account permanently?</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p className="text-default-700">
                    This will permanently delete your account and all of its
                    data. This action cannot be undone.
                  </p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary">
                    Cancel
                  </Button>
                  <Button slot="close" variant="danger" onPress={handleDelete}>
                    Delete Account
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-default-900">Settings</h1>
        <p className="text-default-500">Manage your profile, account preferences, and application settings.</p>
      </div>

      {showSuccess && (
        <Card className="fixed top-24 right-8 z-[203] bg-surface border border-divider p-4 shadow-[var(--overlay-shadow)] w-auto max-w-xs">
          <div className="flex gap-3 items-center">
            <div className="bg-success text-success-foreground rounded-full p-1 shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-foreground text-sm">Updated Successfully</p>
              <p className="text-xs text-muted-foreground">Your changes have been saved.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4 mt-2">
        <Tabs className="w-full">
          <Tabs.ListContainer className="border-b border-divider">
            <Tabs.List aria-label="Settings Categories">
              <Tabs.Tab id="General" className="text-default-500 data-[selected=true]:text-foreground data-[hover=true]:text-foreground transition-colors font-semibold px-6 py-2">
                General
                <Tabs.Indicator className="bg-default-200 shadow-sm" />
              </Tabs.Tab>
              <Tabs.Tab id="Security" className="text-default-500 data-[selected=true]:text-foreground data-[hover=true]:text-foreground transition-colors font-semibold px-6 py-2">
                Security
                <Tabs.Indicator className="bg-default-200 shadow-sm" />
              </Tabs.Tab>
              <Tabs.Tab id="Team" className="text-default-500 data-[selected=true]:text-foreground data-[hover=true]:text-foreground transition-colors font-semibold px-6 py-2">
                Team
                <Tabs.Indicator className="bg-default-200 shadow-sm" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="General" className="pt-6">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Card className="bg-surface border border-divider p-8 h-full">
                    <h2 className="text-xl font-bold text-default-900 mb-6">Profile Information</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField variant="primary">
                        <Label>Display Name</Label>
                        <InputGroup className="border border-divider rounded-medium">
                          <InputGroup.Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </InputGroup>
                      </TextField>

                      <TextField variant="primary">
                        <Label>Email Address</Label>
                        <InputGroup className="border border-divider rounded-medium bg-default-50">
                          <InputGroup.Input defaultValue="john.doe@example.com" disabled />
                        </InputGroup>
                      </TextField>

                      <div className="sm:col-span-2">
                        <TextField variant="primary">
                          <Label>Bio</Label>
                          <TextArea
                            placeholder="Tell us about yourself..."
                            className="border border-divider rounded-medium mt-1"
                            value={formData.bio}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                          />
                        </TextField>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-8 pt-8 border-t border-divider">
                      <Button
                        variant="primary"
                        className="font-bold px-8 h-12"
                        onPress={handleUpdate}
                      >
                        Update Profile
                      </Button>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="bg-surface border border-divider p-8 h-full">
                    <h2 className="text-xl font-bold text-default-900 mb-6">Preferences</h2>

                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4 transition-colors">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                          </svg>
                        </div>
                        <Switch
                          isSelected={preferences.email}
                          onChange={(isSelected: boolean) => setPreferences({ ...preferences, email: isSelected })}
                          className="flex-1 justify-between"
                        >
                          <Switch.Content>
                            <Label className="font-bold text-default-900">Email Notifications</Label>
                            <Description className="text-xs text-default-500">Receive alerts when agents perform significant tasks.</Description>
                          </Switch.Content>
                          <Switch.Control className="data-[selected=true]:bg-primary data-[selected=false]:bg-default-300">
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-4 transition-colors">
                        <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                        </div>
                        <Switch
                          isSelected={preferences.desktop}
                          onChange={(isSelected: boolean) => setPreferences({ ...preferences, desktop: isSelected })}
                          className="flex-1 justify-between"
                        >
                          <Switch.Content>
                            <Label className="font-bold text-default-900">Desktop Alerts</Label>
                            <Description className="text-xs text-default-500">Show desktop notifications for real-time status updates.</Description>
                          </Switch.Content>
                          <Switch.Control className="data-[selected=true]:bg-secondary data-[selected=false]:bg-default-300">
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              {dangerZone}
            </div>
          </Tabs.Panel>

          <Tabs.Panel id="Security" className="pt-6">
            <div className="flex flex-col gap-6">
              <Card className="bg-surface border border-divider p-8">
                <h2 className="text-xl font-bold text-default-900 mb-4">Security Settings</h2>
                <p className="text-default-500 italic text-sm">Security configuration and password management coming soon...</p>
              </Card>
              <Card className="bg-surface border border-divider p-8">
                <h2 className="text-xl font-bold text-default-900 mb-4">API Keys</h2>
                <p className="text-default-500 italic text-sm">API key management for external integrations coming soon...</p>
              </Card>
            </div>
          </Tabs.Panel>

          <Tabs.Panel id="Team" className="pt-6">
            <div className="flex flex-col gap-6">
              <Card className="bg-surface border border-divider p-8">
                <h2 className="text-xl font-bold text-default-900 mb-4">Team Management</h2>
                <p className="text-default-500 italic text-sm">Team collaboration and seat management coming soon...</p>
              </Card>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { metadataApi, useApi } from "@/lib/api";
import type { Group, Speciality, Year } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: groups, mutate: mutateGroups, isLoading: loadingGroups } = useApi<Group[]>("/metadata/groups");
  const { data: specialities, mutate: mutateSpecialities, isLoading: loadingSpecialities } = useApi<Speciality[]>("/metadata/specialities");
  const { data: years, mutate: mutateYears, isLoading: loadingYears } = useApi<Year[]>("/metadata/years");

  const [newGroup, setNewGroup] = useState("");
  const [newSpeciality, setNewSpeciality] = useState("");
  const [newYear, setNewYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddGroup = async () => {
    if (!newGroup.trim()) return;
    try {
      setIsSubmitting(true);
      await metadataApi.addGroup(newGroup.trim());
      setNewGroup("");
      mutateGroups();
      toast.success("Group added successfully");
    } catch (error) {
      toast.error("Failed to add group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await metadataApi.deleteGroup(id);
      mutateGroups();
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleAddSpeciality = async () => {
    if (!newSpeciality.trim()) return;
    try {
      setIsSubmitting(true);
      await metadataApi.addSpeciality(newSpeciality.trim());
      setNewSpeciality("");
      mutateSpecialities();
      toast.success("Speciality added successfully");
    } catch (error) {
      toast.error("Failed to add speciality");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpeciality = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speciality?")) return;
    try {
      await metadataApi.deleteSpeciality(id);
      mutateSpecialities();
      toast.success("Speciality deleted");
    } catch (error) {
      toast.error("Failed to delete speciality");
    }
  };

  const handleAddYear = async () => {
    if (!newYear.trim()) return;
    try {
      setIsSubmitting(true);
      await metadataApi.addYear(newYear.trim());
      setNewYear("");
      mutateYears();
      toast.success("Year added successfully");
    } catch (error) {
      toast.error("Failed to add year");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteYear = async (id: string) => {
    if (!confirm("Are you sure you want to delete this year?")) return;
    try {
      await metadataApi.deleteYear(id);
      mutateYears();
      toast.success("Year deleted");
    } catch (error) {
      toast.error("Failed to delete year");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500">Manage global groups and specialities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Manage student groups (e.g. 1A, 2B, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New Group Name"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              />
              <Button onClick={handleAddGroup} disabled={isSubmitting || !newGroup.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {loadingGroups ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {groups?.map((group) => (
                  <li key={group._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="font-medium text-sm text-gray-700">{group.name}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteGroup(group._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {groups?.length === 0 && <p className="text-sm text-gray-500 italic">No groups defined.</p>}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Specialities */}
        <Card>
          <CardHeader>
            <CardTitle>Specialities</CardTitle>
            <CardDescription>Manage academic specialities (e.g. Computer Science)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New Speciality Name"
                value={newSpeciality}
                onChange={(e) => setNewSpeciality(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSpeciality()}
              />
              <Button onClick={handleAddSpeciality} disabled={isSubmitting || !newSpeciality.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {loadingSpecialities ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {specialities?.map((spec) => (
                  <li key={spec._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="font-medium text-sm text-gray-700">{spec.name}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSpeciality(spec._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {specialities?.length === 0 && <p className="text-sm text-gray-500 italic">No specialities defined.</p>}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Years */}
        <Card>
          <CardHeader>
            <CardTitle>Years</CardTitle>
            <CardDescription>Manage academic years (e.g. L1, M2)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New Year Name"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddYear()}
              />
              <Button onClick={handleAddYear} disabled={isSubmitting || !newYear.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {loadingYears ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {years?.map((year) => (
                  <li key={year._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="font-medium text-sm text-gray-700">{year.name}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteYear(year._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {years?.length === 0 && <p className="text-sm text-gray-500 italic">No years defined.</p>}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { metadataApi, useApi, modulesApi, teachersApi } from "@/lib/api";
import type { Group, Speciality, Year, Teacher, Module } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: groups, mutate: mutateGroups, isLoading: loadingGroups } = useApi<Group[]>("/metadata/groups");
  const { data: specialities, mutate: mutateSpecialities, isLoading: loadingSpecialities } = useApi<Speciality[]>("/metadata/specialities");
  const { data: years, mutate: mutateYears, isLoading: loadingYears } = useApi<Year[]>("/metadata/years");
  const { data: modulesData, mutate: mutateModules, isLoading: loadingModules } = useApi<{ data: any[] }>("/modules?limit=1000");
  const { data: teachersData } = useApi<{ data: any[] }>("/teachers?limit=1000");

  const [newGroup, setNewGroup] = useState("");
  const [newSpeciality, setNewSpeciality] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleYear, setNewModuleYear] = useState("");
  const [newModuleTeacherId, setNewModuleTeacherId] = useState("");
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

  const handleAddModule = async () => {
    if (!newModuleName.trim() || !newModuleYear || !newModuleTeacherId) {
      toast.error("Please fill in all module fields");
      return;
    }
    try {
      setIsSubmitting(true);
      await modulesApi.create({
        name: newModuleName.trim(),
        year: newModuleYear as any,
        teacherId: newModuleTeacherId,
      });
      setNewModuleName("");
      setNewModuleYear("");
      setNewModuleTeacherId("");
      mutateModules();
      toast.success("Module added successfully");
    } catch (error) {
      toast.error("Failed to add module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      await modulesApi.delete(id);
      mutateModules();
      toast.success("Module deleted successfully");
    } catch (error) {
      toast.error("Failed to delete module");
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

      {/* Modules Management */}
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Manage academic modules and assign them to teachers and academic years.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Module Name</label>
              <Input
                placeholder="e.g. Artificial Intelligence"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newModuleYear}
                onChange={(e) => setNewModuleYear(e.target.value)}
              >
                <option value="">Select Year</option>
                {years?.map((y) => (
                  <option key={y._id} value={y.name}>{y.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Assigned Teacher</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newModuleTeacherId}
                onChange={(e) => setNewModuleTeacherId(e.target.value)}
              >
                <option value="">Select Teacher</option>
                {teachersData?.data?.map((t: any) => (
                  <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddModule} disabled={isSubmitting || !newModuleName.trim() || !newModuleYear || !newModuleTeacherId} className="h-10">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>

          {loadingModules ? (
            <p className="text-sm text-gray-500">Loading modules...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Module Name</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Assigned Teacher</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {modulesData?.data?.map((module: any) => (
                    <tr key={module._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{module.name}</td>
                      <td className="px-4 py-3 text-gray-600">{module.year}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {typeof module.teacherId === "object" && module.teacherId !== null
                          ? module.teacherId.fullName
                          : teachersData?.data?.find((t: any) => t._id === module.teacherId)?.fullName || "Unknown Teacher"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteModule(module._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {modulesData?.data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                        No modules defined. Add one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

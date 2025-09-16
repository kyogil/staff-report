"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({ divisionId: 'all', userId: 'all', month: 'all' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Generate a list of months for the filter
  const monthOptions = useMemo(() => {
    const options = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthPadded = String(month).padStart(2, '0');
      options.push({
        value: `${year}-${monthPadded}`,
        label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      });
      d.setMonth(d.getMonth() - 1);
    }
    return options;
  }, []);

  // Fetch divisions for the filter dropdown
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await fetch('/api/divisions');
        if (!res.ok) throw new Error('Failed to fetch divisions');
        const data = await res.json();
        setDivisions(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDivisions();
  }, []);

  // Fetch users when a division is selected
  useEffect(() => {
    if (filters.divisionId === 'all') {
      setUsers([]);
      setFilters(f => ({ ...f, userId: 'all' }));
      return;
    }
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/users?divisionId=${filters.divisionId}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsers();
  }, [filters.divisionId]);

  // Fetch tasks based on current filters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.divisionId !== 'all') params.append('divisionId', filters.divisionId);
      if (filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.month !== 'all') params.append('month', filters.month);

      const res = await fetch(`/api/admin/tasks?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/tasks'); // Redirect if not admin
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      // Reset user filter if division changes
      ...(filterName === 'divisionId' && { userId: 'all' }),
    }));
  };

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard: All Tasks</h1>
        <div className="flex items-center gap-4">
          <Select onValueChange={(value) => handleFilterChange('month', value)} value={filters.month}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange('divisionId', value)} value={filters.divisionId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map(div => <SelectItem key={div.id} value={String(div.id)}>{div.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange('userId', value)} value={filters.userId} disabled={filters.divisionId === 'all'}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(user => <SelectItem key={user.id} value={String(user.id)}>{user.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="6" className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.nama_task}</TableCell>
                  <TableCell>{task.pengguna_nama}</TableCell>
                  <TableCell>{task.divisi_nama}</TableCell>
                  <TableCell>{new Date(task.tanggal_mulai).toLocaleString()}</TableCell>
                  <TableCell>{task.tanggal_selesai ? new Date(task.tanggal_selesai).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.tanggal_selesai ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {task.tanggal_selesai ? 'Completed' : 'Pending'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan="6" className="text-center">No tasks found for the selected filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

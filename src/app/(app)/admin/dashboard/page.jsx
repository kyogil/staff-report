"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await fetch('/api/divisions');
        if (!res.ok) throw new Error('Failed to fetch divisions');
        const data = await res.json();
        setDivisions(data);
      } catch (error) { console.error(error); }
    };
    fetchDivisions();
  }, []);

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
      } catch (error) { console.error(error); }
    };
    fetchUsers();
  }, [filters.divisionId]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.divisionId !== 'all') params.append('divisionId', filters.divisionId);
      if (filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.month !== 'all') params.append('month', filters.month);

      const res = await fetch(`/api/admin/tasks?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/tasks');
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
      ...(filterName === 'divisionId' && { userId: 'all' }),
    }));
  };

  const handleExportCSV = () => {
    const headers = [
      "NAMA",
      "URAIAN INSTRUKSI PEKERJAAN",
      "DITERIMA",
      "DISELESAIKAN",
      "HASIL"
    ];

    // Helper to format data and escape commas
    const escapeCsvCell = (cell) => {
      if (cell === null || cell === undefined) return '';
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [headers.join(',')];
    tasks.forEach(task => {
      const row = [
        escapeCsvCell(task.pengguna_nama),
        escapeCsvCell(task.deskripsi),
        escapeCsvCell(new Date(task.tanggal_mulai).toLocaleString()),
        escapeCsvCell(task.tanggal_selesai ? new Date(task.tanggal_selesai).toLocaleString() : ''),
        escapeCsvCell(task.hasil)
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'task_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard: All Tasks</h1>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => handleFilterChange('month', value)} value={filters.month}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange('divisionId', value)} value={filters.divisionId}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Division" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map(div => <SelectItem key={div.id} value={String(div.id)}>{div.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => handleFilterChange('userId', value)} value={filters.userId} disabled={filters.divisionId === 'all'}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by User" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(user => <SelectItem key={user.id} value={String(user.id)}>{user.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} disabled={tasks.length === 0}>Export to CSV</Button>
        </div>
      </header>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Task Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="7" className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.pengguna_nama}</TableCell>
                  <TableCell className="font-medium">{task.nama_task}</TableCell>
                  <TableCell>{task.deskripsi}</TableCell>
                  <TableCell>{new Date(task.tanggal_mulai).toLocaleString()}</TableCell>
                  <TableCell>{task.tanggal_selesai ? new Date(task.tanggal_selesai).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.tanggal_selesai ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {task.tanggal_selesai ? 'Completed' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>{task.hasil || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan="7" className="text-center">No tasks found for the selected filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

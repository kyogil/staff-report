"use client";

import { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';

// Sub-component for the Create/Edit Task Form Dialog
const TaskDialog = ({ open, onOpenChange, task, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (task) {
      // If editing, populate form with task data
      setFormData({
        nama_task: task.nama_task || '',
        deskripsi: task.deskripsi || '',
        tanggal_mulai: task.tanggal_mulai ? new Date(task.tanggal_mulai).toISOString().slice(0, 16) : '',
        tanggal_selesai: task.tanggal_selesai ? new Date(task.tanggal_selesai).toISOString().slice(0, 16) : null,
        hasil: task.hasil || '',
      });
    } else {
      // If creating, start with a blank form
      setFormData({
        nama_task: '',
        deskripsi: '',
        tanggal_mulai: new Date().toISOString().slice(0, 16),
        tanggal_selesai: null,
        hasil: '',
      });
    }
  }, [task, open]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value ? new Date(value).toISOString() : null }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, task?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details of your task." : "Fill in the details for your new task."}
          </DialogDescription>
        </Header>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama_task" className="text-right">Task Name</Label>
              <Input id="nama_task" value={formData.nama_task || ''} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deskripsi" className="text-right">Description</Label>
              <Textarea id="deskripsi" value={formData.deskripsi || ''} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tanggal_mulai" className="text-right">Start Date</Label>
              <Input id="tanggal_mulai" type="datetime-local" value={formData.tanggal_mulai || ''} onChange={handleDateChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tanggal_selesai" className="text-right">End Date</Label>
              <Input id="tanggal_selesai" type="datetime-local" value={formData.tanggal_selesai ? new Date(formData.tanggal_selesai).toISOString().slice(0, 16) : ''} onChange={handleDateChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hasil" className="text-right">Result</Label>
              <Textarea id="hasil" value={formData.hasil || ''} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null for new, task object for editing
  const router = useRouter();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${filter}`);
      if (!res.ok) {
        if (res.status === 401) router.push('/login'); // Redirect if not authenticated
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSaveTask = async (formData, taskId) => {
    const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks';
    const method = taskId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save task');

      setIsDialogOpen(false);
      setEditingTask(null);
      fetchTasks(); // Refresh tasks list
    } catch (error) {
      console.error(error);
    }
  };

  const openNewTaskDialog = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEditTaskDialog = (task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Daily Tasks</h1>
        <div className="flex items-center gap-4">
           <Select onValueChange={setFilter} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNewTaskDialog}>Create New Task</Button>
        </div>
      </header>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.nama_task}</TableCell>
                  <TableCell>{new Date(task.tanggal_mulai).toLocaleString()}</TableCell>
                  <TableCell>{task.tanggal_selesai ? new Date(task.tanggal_selesai).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.tanggal_selesai ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {task.tanggal_selesai ? 'Completed' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openEditTaskDialog(task)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan="5" className="text-center">No tasks found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
}

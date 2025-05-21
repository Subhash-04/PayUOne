export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface DataEntry {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  totalAmount?: number;
  collaborators?: Collaborator[];
}

export interface Collaborator {
  userId: string;
  name: string;
  role: 'editor' | 'viewer';
}

export interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'amount' | 'date';
}

export interface TableRow {
  id: string;
  cells: {
    [columnId: string]: string | number | null;
  };
}

export interface Table {
  id: string;
  name: string;
  columns: TableColumn[];
  rows: TableRow[];
}
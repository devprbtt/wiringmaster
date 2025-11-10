import { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import DiagramForm from "../components/diagrams/DiagramForm";
import type { Diagram } from "@/types";

export default function Diagrams() {
  const [showForm, setShowForm] = useState(false);
  const [editingDiagram, setEditingDiagram] = useState<Diagram | null>(null);
  const queryClient = useQueryClient();

  const { data: diagrams = [], isLoading } = useQuery({
    queryKey: ['diagrams'],
    queryFn: async () => {
      const allDiagrams = await api.diagrams.list();
      return allDiagrams.sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime());
    },
  });

  const deleteDiagramMutation = useMutation({
    mutationFn: (id) => api.diagrams.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
    },
  });

  const handleEdit = (diagram: Diagram) => {
    setEditingDiagram(diagram);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <DiagramForm
        diagram={editingDiagram}
        onClose={() => {
          setShowForm(false);
          setEditingDiagram(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Diagrams</h1>
            <p className="text-gray-500 mt-1">Create and manage wiring diagrams</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-cyan-600 hover:bg-cyan-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Diagram
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diagrams.map((diagram) => (
            <Card key={diagram.id} className="group hover:shadow-xl transition-all duration-300 hover:border-cyan-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{diagram.name}</CardTitle>
                    {diagram.client_name && (
                      <p className="text-sm text-gray-600 font-medium">Client: {diagram.client_name}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {diagram.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{diagram.description}</p>
                )}
                <p className="text-xs text-gray-400 mb-4">
                  Last updated: {format(new Date(diagram.updated_date), 'MMM d, yyyy')}
                </p>
                <div className="flex gap-2">
                  <Link to={createPageUrl(`DiagramEditor?id=${diagram.id}`)} className="flex-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(diagram)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this diagram? This will also delete all devices and connections in it.')) {
                        deleteDiagramMutation.mutate(diagram.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {diagrams.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No diagrams yet</h3>
            <p className="text-gray-500 mb-6">Create your first wiring diagram</p>
            <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-5 h-5 mr-2" />
              Create Diagram
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

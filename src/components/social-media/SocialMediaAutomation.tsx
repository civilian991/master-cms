'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Play, Pause, Settings } from 'lucide-react';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
}

interface AutomationCondition {
  id: string;
  type: 'time' | 'engagement' | 'content' | 'schedule';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

interface AutomationAction {
  id: string;
  type: 'post' | 'reply' | 'like' | 'share' | 'follow';
  platform: string;
  content?: string;
  target?: string;
}

export function SocialMediaAutomation({ siteId }: { siteId: string }) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);

  useEffect(() => {
    loadWorkflows();
  }, [siteId]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      // This would call the automation API when implemented
      // For now, we'll use mock data
      const mockWorkflows: AutomationWorkflow[] = [
        {
          id: '1',
          name: 'Weekly Content Schedule',
          description: 'Automatically posts weekly content at optimal times',
          trigger: 'schedule',
          conditions: [
            { id: '1', type: 'schedule', operator: 'equals', value: 'weekly' }
          ],
          actions: [
            { id: '1', type: 'post', platform: 'TWITTER', content: 'Weekly update content' }
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Engagement Response',
          description: 'Automatically responds to high-engagement posts',
          trigger: 'engagement',
          conditions: [
            { id: '2', type: 'engagement', operator: 'greater_than', value: '100' }
          ],
          actions: [
            { id: '2', type: 'reply', platform: 'TWITTER', content: 'Thank you for the engagement!' }
          ],
          isActive: false,
          createdAt: new Date().toISOString(),
        }
      ];
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!workflowName || !selectedTrigger) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newWorkflow: AutomationWorkflow = {
        id: Date.now().toString(),
        name: workflowName,
        description: workflowDescription,
        trigger: selectedTrigger,
        conditions,
        actions,
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      setWorkflows([...workflows, newWorkflow]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    try {
      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, isActive: !w.isActive } : w
      ));
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      setWorkflows(workflows.filter(w => w.id !== workflowId));
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const addCondition = () => {
    const newCondition: AutomationCondition = {
      id: Date.now().toString(),
      type: 'time',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (conditionId: string) => {
    setConditions(conditions.filter(c => c.id !== conditionId));
  };

  const addAction = () => {
    const newAction: AutomationAction = {
      id: Date.now().toString(),
      type: 'post',
      platform: 'TWITTER',
      content: '',
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  const resetForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setSelectedTrigger('');
    setConditions([]);
    setActions([]);
  };

  const getTriggerLabel = (trigger: string) => {
    const triggers = {
      schedule: 'Schedule',
      engagement: 'Engagement',
      content: 'Content',
      time: 'Time',
    };
    return triggers[trigger as keyof typeof triggers] || trigger;
  };

  const getActionLabel = (action: AutomationAction) => {
    const actionLabels = {
      post: 'Post',
      reply: 'Reply',
      like: 'Like',
      share: 'Share',
      follow: 'Follow',
    };
    return `${actionLabels[action.type as keyof typeof actionLabels]} on ${action.platform}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Automation Workflows</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Create Workflow Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Trigger</label>
                <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does"
                rows={3}
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Conditions</label>
                <Button size="sm" onClick={addCondition}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Condition
                </Button>
              </div>
              <div className="space-y-2">
                {conditions.map((condition) => (
                  <div key={condition.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select value={condition.type} onValueChange={(value) => 
                      setConditions(conditions.map(c => 
                        c.id === condition.id ? { ...c, type: value as any } : c
                      ))
                    }>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={condition.operator} onValueChange={(value) => 
                      setConditions(conditions.map(c => 
                        c.id === condition.id ? { ...c, operator: value as any } : c
                      ))
                    }>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={condition.value}
                      onChange={(e) => 
                        setConditions(conditions.map(c => 
                          c.id === condition.id ? { ...c, value: e.target.value } : c
                        ))
                      }
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={() => removeCondition(condition.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Actions</label>
                <Button size="sm" onClick={addAction}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Action
                </Button>
              </div>
              <div className="space-y-2">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select value={action.type} onValueChange={(value) => 
                      setActions(actions.map(a => 
                        a.id === action.id ? { ...a, type: value as any } : a
                      ))
                    }>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="reply">Reply</SelectItem>
                        <SelectItem value="like">Like</SelectItem>
                        <SelectItem value="share">Share</SelectItem>
                        <SelectItem value="follow">Follow</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={action.platform} onValueChange={(value) => 
                      setActions(actions.map(a => 
                        a.id === action.id ? { ...a, platform: value } : a
                      ))
                    }>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TWITTER">Twitter</SelectItem>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={action.content || ''}
                      onChange={(e) => 
                        setActions(actions.map(a => 
                          a.id === action.id ? { ...a, content: e.target.value } : a
                        ))
                      }
                      placeholder="Content"
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={() => removeAction(action.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createWorkflow}>Create Workflow</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No workflows found</div>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge variant="outline">{getTriggerLabel(workflow.trigger)}</Badge>
                      <Badge className={workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(workflow.createdAt).toLocaleDateString()}
                      {workflow.lastExecuted && (
                        <span className="ml-4">
                          Last executed: {new Date(workflow.lastExecuted).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-medium mb-1">Actions:</div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.actions.map((action) => (
                          <Badge key={action.id} variant="secondary" className="text-xs">
                            {getActionLabel(action)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWorkflow(workflow.id)}
                    >
                      {workflow.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 
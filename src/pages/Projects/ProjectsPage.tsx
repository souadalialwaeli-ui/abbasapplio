import { useState } from 'react';
import { FileAudio, FolderKanban, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Button, Card, Field, PageHeader, inputClass } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { WaveformPlayer } from '../../components/audio/WaveformPlayer';
import { AudioUploader } from '../../components/uploads/AudioUploader';
import { ACCEPTED_AUDIO, analyzeAudioFile, formatBytes } from '../../services/audio/audioAnalysis';
import { deleteProject, generateId, saveProject } from '../../services/db';
import type { AudioProject, ProjectFile } from '../../types';

export function ProjectsPage() {
  const { t, projects, refreshProjects } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const createProject = async () => {
    if (!name.trim()) return;
    const project: AudioProject = {
      id: generateId(),
      name: name.trim(),
      notes: notes.trim(),
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProject(project);
    await refreshProjects();
    setName('');
    setNotes('');
    setModalOpen(false);
  };

  const addFiles = async (project: AudioProject, picked: File[]) => {
    const files: ProjectFile[] = [];
    for (const file of picked) {
      let durationSec: number | undefined;
      try {
        durationSec = (await analyzeAudioFile(file)).durationSec;
      } catch {
        durationSec = undefined;
      }
      files.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        blob: file,
        durationSec,
        addedAt: new Date().toISOString(),
      });
    }
    await saveProject({ ...project, files: [...project.files, ...files], updatedAt: new Date().toISOString() });
    await refreshProjects();
  };

  const removeFile = async (project: AudioProject, fileId: string) => {
    await saveProject({
      ...project,
      files: project.files.filter((f) => f.id !== fileId),
      updatedAt: new Date().toISOString(),
    });
    await refreshProjects();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('projectsTitle')}
        subtitle={t('projectsSubtitle')}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('newProject')}
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={t('noProjectsYet')}
          action={<Button onClick={() => setModalOpen(true)}>{t('newProject')}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const open = openProjectId === project.id;
            return (
              <Card key={project.id}>
                <button
                  type="button"
                  onClick={() => setOpenProjectId(open ? null : project.id)}
                  className="flex w-full items-center justify-between gap-3 text-start"
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{project.name}</p>
                    <p className="mt-0.5 text-xs text-mist-500">
                      {project.files.length} {t('filesCount')}
                      {project.notes ? ` · ${project.notes}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-iris-300">{open ? t('close') : t('open')}</span>
                </button>

                {open && (
                  <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                    <AudioUploader
                      accept={ACCEPTED_AUDIO}
                      multiple
                      label={t('addFiles')}
                      onFiles={(picked) => void addFiles(project, picked)}
                    />
                    {project.files.length === 0 ? (
                      <p className="flex items-center gap-2 py-2 text-xs text-mist-500">
                        <FileAudio className="h-4 w-4" />
                        {t('emptyProject')}
                      </p>
                    ) : (
                      project.files.map((f) => (
                        <div key={f.id} className="space-y-1.5">
                          {f.blob ? (
                            <WaveformPlayer blob={f.blob} fileName={f.name} compact />
                          ) : (
                            <p className="truncate text-xs text-mist-300" dir="ltr">
                              {f.name} · {formatBytes(f.size)}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => void removeFile(project, f.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-300 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('delete')}
                          </button>
                        </div>
                      ))
                    )}
                    <div className="pt-1">
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (window.confirm(t('deleteConfirm'))) {
                            await deleteProject(project.id);
                            await refreshProjects();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('deleteProject')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('newProject')}>
        <div className="space-y-4">
          <Field label={`${t('projectName')} — ${t('required')}`}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t('projectName')} />
          </Field>
          <Field label={t('projectNotes')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={createProject} disabled={!name.trim()} className="flex-1">
              {t('save')}
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { StepWizard } from '@/components/wizard/StepWizard';

const CreateProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  return <StepWizard editProjectId={projectId} />;
};

export default CreateProjectPage;

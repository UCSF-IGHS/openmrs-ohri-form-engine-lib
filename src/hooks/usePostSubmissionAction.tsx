import React, { useEffect, useState } from 'react';
import { PostSubmissionAction } from '../api/types';
import { getPostSubmissionActionById } from '../registry/registry';

export function usePostSubmissionAction(actionIds: Array<string>) {
  const [action, setAction] = useState<PostSubmissionAction>(null);
  useEffect(() => {
    if (actionIds) {
      actionIds.forEach(actionId => {
        getPostSubmissionActionById(actionId).then(response => setAction(response.default));
      });
    }
  }, [actionIds]);

  return action;
}

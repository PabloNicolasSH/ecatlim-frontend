export interface EducationStage {
  id?: number;
  name: string;
  code: string;
  description: string;
  previousStageRequired?: boolean;
  previousStageId?: number;
}

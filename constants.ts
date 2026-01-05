
import { TreatmentType } from './types';

export const TREATMENT_TIMES: Record<string, number> = {
  'ICT': 10 * 60,
  '침': 10 * 60,
  '핫팩': 10 * 60,
  '부항': 3 * 60,
  'Ice': 5 * 60,
  '추나': 0, // 타이머 없음
  '소노_짧음': 5 * 60 + 30,
  '소노_길음': 10 * 60,
  '충격파_짧음': 5 * 60 + 30,
  '충격파_길음': 10 * 60,
};

export const INITIAL_BED_COUNT = 8;
export const DEFAULT_TREATMENTS: TreatmentType[] = ['ICT', '부항', '침', '핫팩'];

export const STATUS_ORDER: Record<string, number> = {
  '진행중': 0,
  '대기': 1,
  '완료': 2,
  '안함': 3,
};

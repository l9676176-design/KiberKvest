import { classroomExperience } from './classroom.js';
import { familyExperience } from './family.js';
import { soloExperience } from './solo.js';
const EXPERIENCES={solo:soloExperience,family:familyExperience,classroom:classroomExperience};
export function getModeExperience(mode){return EXPERIENCES[mode]||soloExperience;}

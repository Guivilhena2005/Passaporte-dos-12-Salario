import {SCHEMA_VERSION} from '../config/constants.js';import {loadData,saveData} from './auth.js';
export async function loadState(){const data=await loadData('planning');return data?.version===SCHEMA_VERSION?data:null}
export async function saveState(data){return saveData('planning',{version:SCHEMA_VERSION,...data})}

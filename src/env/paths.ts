import type { AgentConfig } from './agents'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { hasTTY, isCI } from 'std-env'
import { expandPath } from '../utils/path'

export interface XDGPaths {
  data: string
  config: string
  cache: string
  state: string
}

export function getXDGPaths(): XDGPaths {
  const home = homedir()
  return {
    data: process.env.XDG_DATA_HOME || join(home, '.local', 'share'),
    config: process.env.XDG_CONFIG_HOME || join(home, '.config'),
    cache: process.env.XDG_CACHE_HOME || join(home, '.cache'),
    state: process.env.XDG_STATE_HOME || join(home, '.local', 'state'),
  }
}

export function getAgentConfigDir(agent: AgentConfig): string {
  return expandPath(agent.configDir)
}

export function getAgentRulesPath(agent: AgentConfig): string | undefined {
  if (!agent.rulesFile)
    return undefined
  return join(getAgentConfigDir(agent), agent.rulesFile)
}

export function getAgentSkillsDir(agent: AgentConfig): string | undefined {
  if (!agent.skillsDir)
    return undefined
  return join(getAgentConfigDir(agent), agent.skillsDir)
}

export function agentConfigExists(agent: AgentConfig): boolean {
  return existsSync(getAgentConfigDir(agent))
}

export { hasTTY, isCI }

/** @deprecated Use `hasTTY` from std-env instead */
export const isTTY: boolean = hasTTY

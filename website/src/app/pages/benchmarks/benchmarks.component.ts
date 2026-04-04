import { Component } from '@angular/core';

@Component({
  selector: 'app-benchmarks',
  templateUrl: './benchmarks.component.html',
  styleUrls: ['./benchmarks.component.scss']
})
export class BenchmarksComponent {
  valueScore = 100.0;
  passRate = 100.0;
  totalScenarios = 15;
  failedScenarios = 0;
  version = '1.0.0-SNAPSHOT';

  categories = [
    { name: 'Core Capabilities', score: 100, weight: '25%', scenarios: 6 },
    { name: 'Enterprise Readiness', score: 100, weight: '20%', scenarios: 3 },
    { name: 'Resilience', score: 100, weight: '15%', scenarios: 3 },
    { name: 'DSL & Configuration', score: 100, weight: '15%', scenarios: 3 },
  ];

  scenarios = [
    { id: 'core-agent-builder', name: 'Agent Builder Validation', category: 'CORE', passed: true, score: 100 },
    { id: 'core-task-builder', name: 'Task Builder with Dependencies', category: 'CORE', passed: true, score: 100 },
    { id: 'core-memory', name: 'Memory Store/Retrieve', category: 'CORE', passed: true, score: 100 },
    { id: 'core-observability-propagation', name: 'ObservabilityContext Thread Propagation', category: 'CORE', passed: true, score: 100 },
    { id: 'core-budget', name: 'Budget Tracking', category: 'CORE', passed: true, score: 100 },
    { id: 'core-exceptions', name: 'Typed Exception Hierarchy', category: 'CORE', passed: true, score: 100 },
    { id: 'enterprise-tenant-isolation', name: 'Tenant Context Isolation', category: 'ENTERPRISE', passed: true, score: 100 },
    { id: 'enterprise-spi-defaults', name: 'SPI Default Implementations', category: 'ENTERPRISE', passed: true, score: 100 },
    { id: 'enterprise-governance', name: 'Governance Model', category: 'ENTERPRISE', passed: true, score: 100 },
    { id: 'resilience-circuit-breaker', name: 'Circuit Breaker Initialization', category: 'RESILIENCE', passed: true, score: 100 },
    { id: 'resilience-health', name: 'Health Indicators', category: 'RESILIENCE', passed: true, score: 100 },
    { id: 'resilience-config-validation', name: 'Configuration Validator', category: 'RESILIENCE', passed: true, score: 100 },
    { id: 'dsl-parser-available', name: 'YAML Parser Available', category: 'DSL', passed: true, score: 100 },
    { id: 'dsl-compiler-available', name: 'Swarm Compiler Available', category: 'DSL', passed: true, score: 100 },
    { id: 'dsl-process-types', name: 'All 7 Process Types', category: 'DSL', passed: true, score: 100 },
  ];

  competitors = [
    { name: 'SwarmAI', language: 'Java', selfImproving: true, governance: true, budget: true, multiTenant: true, yamlDsl: true, tools: 24 },
    { name: 'LangGraph', language: 'Python', selfImproving: false, governance: false, budget: false, multiTenant: false, yamlDsl: false, tools: 0 },
    { name: 'CrewAI', language: 'Python', selfImproving: false, governance: false, budget: false, multiTenant: false, yamlDsl: true, tools: 10 },
    { name: 'AutoGen', language: 'Python', selfImproving: false, governance: false, budget: false, multiTenant: false, yamlDsl: false, tools: 0 },
    { name: 'Semantic Kernel', language: 'Java/.NET', selfImproving: false, governance: false, budget: false, multiTenant: false, yamlDsl: false, tools: 5 },
  ];
}

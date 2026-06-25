---
title: 从零构建一个 AI Agent 开发环境
tags:
  - Agent
  - Tool Use
  - MCP
categories: AI Agent
abbrlink: de05965d
date: 2026-06-01 16:14:00
---

> 2026 年，AI Agent 已经从前沿实验变成了工程实践。这篇文章记录我搭建个人 Agent 开发环境的完整过程。

## 为什么我们需要 Agent

传统 LLM 应用是"一问一答"的对话模式，但真正的智能体需要能够：

- **自主决策**：根据上下文选择下一步行动
- **工具调用**：读写文件、查询数据库、调用 API
- **多步推理**：将复杂任务拆解为可执行的子任务链

这正是 Function Calling → Tool Use → Agent 这条演进路线的核心逻辑。

## 技术选型

当前主流的 Agent 框架各有侧重：

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| LangChain | 生态完善，抽象层多 | 快速原型 |
| CrewAI | 多 Agent 协作 | 复杂工作流 |
| 自研轻量 Agent | 可控性高，依赖少 | 生产环境 |

我选择了**自研轻量 Agent** 路线，核心依赖仅三个：LLM 接口、Tool 注册表、消息循环。

## 核心架构

```typescript
interface AgentConfig {
  model: string;
  tools: Tool[];
  systemPrompt: string;
  maxSteps: number;
}

class Agent {
  private messages: Message[] = [];
  private toolRegistry: Map<string, Tool>;

  async run(userInput: string): Promise<string> {
    this.messages.push({ role: 'user', content: userInput });

    for (let step = 0; step < this.maxSteps; step++) {
      const response = await this.llm.chat(this.messages);

      if (response.toolCalls?.length) {
        for (const call of response.toolCalls) {
          const result = await this.executeTool(call);
          this.messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: call.id
          });
        }
        continue;
      }

      return response.content;
    }
  }
}
```

## MCP 协议的价值

Model Context Protocol（MCP）解决了 Agent 与外部工具之间的**标准化通信问题**。就像 USB-C 统一了硬件接口，MCP 让任何实现了该协议的工具都能被 Agent 无缝调用。

一个典型的 MCP Server 实现只需要暴露 `tools/list` 和 `tools/call` 两个端点，配合 JSON Schema 描述工具参数。

## 踩过的坑

1. **Token 消耗失控**：Tool 调用结果直接塞进上下文，10 步推理轻松超 8K tokens。解决方案是压缩工具返回，只保留关键字段。
2. **无限循环**：Agent 有时会在两个工具之间反复横跳。加入 `maxSteps` 硬限制 + 重复检测机制。
3. **Prompt 工程**：System Prompt 的质量直接决定 Agent 的稳定性。建议用结构化的 Markdown 格式，明确列出工具使用规则和边界条件。

## 下一步

计划实现：
- 流式工具调用（streaming tool use）
- 人机协同确认机制（human-in-the-loop）
- Agent 执行日志的可视化面板

Stay tuned，下一篇会聊聊如何用 Next.js 搭建 Agent 对话界面。

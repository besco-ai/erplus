using ERPlus.Modules.Automation.Domain.Entities;
using ERPlus.Modules.Automation.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Automation.Application;

public record AutomationRuleDto(
    int Id, string Name, string Trigger, int? TriggerStageId, int? TriggerPipelineId,
    string Action, int? ActionPipelineId, int? ActionStageId, string? TaskTitle,
    int? DiligenceTemplateId, bool Active, string? ConditionJson);

public record CreateRuleRequest(
    string Name, string Trigger, int? TriggerStageId, int? TriggerPipelineId,
    string Action, int? ActionPipelineId, int? ActionStageId, string? TaskTitle,
    int? DiligenceTemplateId, string? ConditionJson);

public record UpdateRuleRequest(
    string? Name, bool? Active, string? Trigger, int? TriggerStageId, int? TriggerPipelineId,
    string? Action, int? ActionPipelineId, int? ActionStageId, string? TaskTitle,
    int? DiligenceTemplateId, string? ConditionJson);

public class AutomationService
{
    private readonly AutomationDbContext _db;
    public AutomationService(AutomationDbContext db) => _db = db;

    public async Task<Result<List<AutomationRuleDto>>> GetAllAsync() =>
        Result<List<AutomationRuleDto>>.Success(await _db.Rules.OrderBy(r => r.Name)
            .Select(r => new AutomationRuleDto(r.Id, r.Name, r.Trigger, r.TriggerStageId, r.TriggerPipelineId,
                r.Action, r.ActionPipelineId, r.ActionStageId, r.TaskTitle, r.DiligenceTemplateId, r.Active, r.ConditionJson))
            .ToListAsync());

    public async Task<Result<AutomationRuleDto>> CreateAsync(CreateRuleRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<AutomationRuleDto>.Failure("Nome é obrigatório");
        var rule = new AutomationRule
        {
            Name = r.Name.Trim(), Trigger = r.Trigger, TriggerStageId = r.TriggerStageId,
            TriggerPipelineId = r.TriggerPipelineId, Action = r.Action,
            ActionPipelineId = r.ActionPipelineId, ActionStageId = r.ActionStageId,
            TaskTitle = r.TaskTitle, DiligenceTemplateId = r.DiligenceTemplateId, Active = true,
            ConditionJson = r.ConditionJson
        };
        _db.Rules.Add(rule);
        await _db.SaveChangesAsync();
        return Result<AutomationRuleDto>.Created(new AutomationRuleDto(rule.Id, rule.Name, rule.Trigger,
            rule.TriggerStageId, rule.TriggerPipelineId, rule.Action, rule.ActionPipelineId,
            rule.ActionStageId, rule.TaskTitle, rule.DiligenceTemplateId, rule.Active, rule.ConditionJson));
    }

    public async Task<Result<bool>> UpdateAsync(int id, UpdateRuleRequest r)
    {
        var rule = await _db.Rules.FindAsync(id);
        if (rule is null) return Result<bool>.NotFound();
        if (r.Name is not null) rule.Name = r.Name.Trim();
        if (r.Active.HasValue) rule.Active = r.Active.Value;
        if (r.Trigger is not null) rule.Trigger = r.Trigger;
        if (r.TriggerStageId.HasValue) rule.TriggerStageId = r.TriggerStageId;
        if (r.TriggerPipelineId.HasValue) rule.TriggerPipelineId = r.TriggerPipelineId;
        if (r.Action is not null) rule.Action = r.Action;
        if (r.ActionPipelineId.HasValue) rule.ActionPipelineId = r.ActionPipelineId;
        if (r.ActionStageId.HasValue) rule.ActionStageId = r.ActionStageId;
        if (r.TaskTitle is not null) rule.TaskTitle = r.TaskTitle;
        if (r.DiligenceTemplateId.HasValue) rule.DiligenceTemplateId = r.DiligenceTemplateId;
        if (r.ConditionJson is not null) rule.ConditionJson = r.ConditionJson;
        rule.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var rule = await _db.Rules.FindAsync(id);
        if (rule is null) return Result<bool>.NotFound();
        _db.Rules.Remove(rule);
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}

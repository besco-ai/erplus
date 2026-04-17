using ERPlus.Shared.Domain;

namespace ERPlus.Modules.Automation.Domain.Entities;

public class AutomationRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Trigger { get; set; } = "stage_enter"; // stage_enter, task_complete, deal_won
    public int? TriggerStageId { get; set; }
    public int? TriggerPipelineId { get; set; }
    public string Action { get; set; } = string.Empty; // move_pipeline, create_task, load_diligence
    public int? ActionPipelineId { get; set; }
    public int? ActionStageId { get; set; }
    public string? TaskTitle { get; set; }
    public int? DiligenceTemplateId { get; set; }
    public bool Active { get; set; } = true;
}

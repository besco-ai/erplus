using ERPlus.Modules.Projects.Domain.Entities;
using ERPlus.Modules.Projects.Infrastructure.Data;
using ERPlus.Shared.Application;
using Microsoft.EntityFrameworkCore;

namespace ERPlus.Modules.Projects.Application.Services;

public class ProjectService
{
    private readonly ProjectsDbContext _db;

    public ProjectService(ProjectsDbContext db) => _db = db;

    // ══ Projects ══

    public async Task<Result<List<ProjectDto>>> GetAllAsync(int? pipelineId, int? stageId, int? clientId)
    {
        var query = _db.Projects.Include(p => p.Pipeline).Include(p => p.Stage).AsQueryable();
        if (pipelineId.HasValue) query = query.Where(p => p.PipelineId == pipelineId.Value);
        if (stageId.HasValue) query = query.Where(p => p.StageId == stageId.Value);
        if (clientId.HasValue) query = query.Where(p => p.ClientId == clientId.Value);

        var items = await query.OrderByDescending(p => p.StartDate ?? p.CreatedAt)
            .Select(p => new ProjectDto(
                p.Id, p.Title, p.ClientId, p.DealId, p.Value,
                p.PipelineId, p.Pipeline.Name, p.StageId, p.Stage.Name,
                p.ResponsibleId, p.StartDate, p.EndDate,
                p.Registro, p.InscricaoImob, p.EndEmpreendimento,
                p.TipologiaTerreno, p.MorfologiaTerreno, p.Testada, p.AreaTerreno,
                p.BusinessTypeId, p.CreatedAt))
            .ToListAsync();

        return Result<List<ProjectDto>>.Success(items);
    }

    public async Task<Result<ProjectDetailDto>> GetByIdAsync(int id)
    {
        var p = await _db.Projects.Include(x => x.Stage).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return Result<ProjectDetailDto>.NotFound();

        return Result<ProjectDetailDto>.Success(new ProjectDetailDto(
            p.Id, p.Title, p.ClientId, p.DealId, p.Value,
            p.PipelineId, p.StageId, p.Stage.Name, p.ResponsibleId,
            p.StartDate, p.EndDate, p.Notes,
            p.Registro, p.InscricaoImob, p.EndEmpreendimento,
            p.TipologiaTerreno, p.MorfologiaTerreno, p.Testada, p.AreaTerreno,
            p.BusinessTypeId, p.CreatedAt, p.UpdatedAt));
    }

    public async Task<Result<ProjectDto>> CreateAsync(CreateProjectRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title))
            return Result<ProjectDto>.Failure("Título é obrigatório");
        if (r.ClientId <= 0)
            return Result<ProjectDto>.Failure("Cliente é obrigatório");

        var pipeline = await _db.Pipelines.Include(p => p.Stages).FirstOrDefaultAsync(p => p.Id == r.PipelineId);
        if (pipeline is null) return Result<ProjectDto>.Failure("Pipeline não encontrado");

        var stage = pipeline.Stages.FirstOrDefault(s => s.Id == r.StageId);
        if (stage is null) return Result<ProjectDto>.Failure("Etapa não pertence ao pipeline");

        var project = new Project
        {
            Title = r.Title.Trim(),
            ClientId = r.ClientId,
            DealId = r.DealId,
            Value = r.Value,
            PipelineId = r.PipelineId,
            StageId = r.StageId,
            ResponsibleId = r.ResponsibleId > 0 ? r.ResponsibleId : 1,
            StartDate = r.StartDate ?? DateTime.UtcNow,
            EndDate = r.EndDate,
            Notes = r.Notes,
            Registro = r.Registro,
            InscricaoImob = r.InscricaoImob,
            EndEmpreendimento = r.EndEmpreendimento,
            TipologiaTerreno = r.TipologiaTerreno,
            MorfologiaTerreno = r.MorfologiaTerreno,
            Testada = r.Testada,
            AreaTerreno = r.AreaTerreno,
            BusinessTypeId = r.BusinessTypeId
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return Result<ProjectDto>.Created(new ProjectDto(
            project.Id, project.Title, project.ClientId, project.DealId, project.Value,
            project.PipelineId, pipeline.Name, project.StageId, stage.Name,
            project.ResponsibleId, project.StartDate, project.EndDate,
            project.Registro, project.InscricaoImob, project.EndEmpreendimento,
            project.TipologiaTerreno, project.MorfologiaTerreno, project.Testada, project.AreaTerreno,
            project.BusinessTypeId, project.CreatedAt));
    }

    public async Task<Result<ProjectDto>> UpdateAsync(int id, UpdateProjectRequest r)
    {
        var project = await _db.Projects.Include(p => p.Pipeline).Include(p => p.Stage).FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return Result<ProjectDto>.NotFound();

        if (r.Title is not null) project.Title = r.Title.Trim();
        if (r.ClientId.HasValue) project.ClientId = r.ClientId.Value;
        if (r.Value.HasValue) project.Value = r.Value.Value;
        if (r.ResponsibleId.HasValue) project.ResponsibleId = r.ResponsibleId.Value;
        if (r.StartDate.HasValue) project.StartDate = r.StartDate.Value;
        if (r.EndDate.HasValue) project.EndDate = r.EndDate.Value;
        if (r.Notes is not null) project.Notes = r.Notes;
        if (r.Registro is not null) project.Registro = r.Registro;
        if (r.InscricaoImob is not null) project.InscricaoImob = r.InscricaoImob;
        if (r.EndEmpreendimento is not null) project.EndEmpreendimento = r.EndEmpreendimento;
        if (r.TipologiaTerreno is not null) project.TipologiaTerreno = r.TipologiaTerreno;
        if (r.MorfologiaTerreno is not null) project.MorfologiaTerreno = r.MorfologiaTerreno;
        if (r.Testada is not null) project.Testada = r.Testada;
        if (r.AreaTerreno is not null) project.AreaTerreno = r.AreaTerreno;

        if (r.StageId.HasValue && r.StageId.Value != project.StageId)
        {
            var newStage = await _db.Stages.FindAsync(r.StageId.Value);
            if (newStage is null) return Result<ProjectDto>.Failure("Etapa não encontrada");
            project.StageId = r.StageId.Value;
        }

        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<ProjectDto>.Success(new ProjectDto(
            project.Id, project.Title, project.ClientId, project.DealId, project.Value,
            project.PipelineId, project.Pipeline.Name, project.StageId, project.Stage.Name,
            project.ResponsibleId, project.StartDate, project.EndDate,
            project.Registro, project.InscricaoImob, project.EndEmpreendimento,
            project.TipologiaTerreno, project.MorfologiaTerreno, project.Testada, project.AreaTerreno,
            project.BusinessTypeId, project.CreatedAt));
    }

    public async Task<Result<bool>> MoveAsync(int id, MoveProjectRequest r)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return Result<bool>.NotFound();

        var stage = await _db.Stages.FindAsync(r.StageId);
        if (stage is null) return Result<bool>.Failure("Etapa não encontrada");

        project.StageId = r.StageId;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return Result<bool>.NotFound();
        project.IsDeleted = true;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ══ Pipelines ══

    public async Task<Result<List<ProjectPipelineDto>>> GetPipelinesAsync()
    {
        var pipelines = await _db.Pipelines
            .Include(p => p.Stages.OrderBy(s => s.Order))
            .OrderBy(p => p.Order)
            .ToListAsync();

        var projects = await _db.Projects.ToListAsync();

        var result = pipelines.Select(p => new ProjectPipelineDto(
            p.Id, p.Name, p.Order,
            p.Stages.Select(s => new ProjectStageDto(
                s.Id, s.Name, s.Order,
                projects.Count(pr => pr.StageId == s.Id),
                projects.Where(pr => pr.StageId == s.Id).Sum(pr => pr.Value)
            )).ToList()
        )).ToList();

        return Result<List<ProjectPipelineDto>>.Success(result);
    }

    public async Task<Result<ProjectPipelineDto>> CreatePipelineAsync(CreateProjectPipelineRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) return Result<ProjectPipelineDto>.Failure("Nome é obrigatório");
        var maxOrder = await _db.Pipelines.MaxAsync(p => (int?)p.Order) ?? -1;
        var pipeline = new ProjectPipeline { Name = r.Name.Trim(), Order = maxOrder + 1 };
        var stage = new ProjectStage { Name = "Nova etapa", Order = 0, Pipeline = pipeline };
        _db.Pipelines.Add(pipeline);
        _db.Stages.Add(stage);
        await _db.SaveChangesAsync();

        return Result<ProjectPipelineDto>.Created(new ProjectPipelineDto(
            pipeline.Id, pipeline.Name, pipeline.Order,
            new List<ProjectStageDto> { new(stage.Id, stage.Name, 0, 0, 0) }));
    }

    public async Task<Result<ProjectStageDto>> AddStageAsync(int pipelineId, CreateProjectStageRequest r)
    {
        var pipeline = await _db.Pipelines.FindAsync(pipelineId);
        if (pipeline is null) return Result<ProjectStageDto>.NotFound("Pipeline não encontrado");

        var stage = new ProjectStage { PipelineId = pipelineId, Name = r.Name.Trim(), Order = r.Order };
        _db.Stages.Add(stage);
        await _db.SaveChangesAsync();

        return Result<ProjectStageDto>.Created(new ProjectStageDto(stage.Id, stage.Name, stage.Order, 0, 0));
    }
}

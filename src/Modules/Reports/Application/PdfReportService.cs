using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ERPlus.Shared.Application;

namespace ERPlus.Modules.Reports.Application;

public class PdfReportService
{
    private readonly DashboardService _dashboard;

    public PdfReportService(DashboardService dashboard)
    {
        _dashboard = dashboard;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<Result<byte[]>> GenerateDashboardPdfAsync()
    {
        var result = await _dashboard.GetDashboardAsync();
        if (!result.IsSuccess) return Result<byte[]>.Failure("Erro ao obter dados do dashboard");

        var d = result.Data!;
        var now = DateTime.Now;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                // Header
                page.Header().BorderBottom(2).BorderColor(Colors.Red.Medium).PaddingBottom(8).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("E+ ERPlus").FontSize(20).Bold().FontColor(Colors.Red.Medium);
                        col.Item().Text("Dashboard Geral").FontSize(14).Bold();
                    });
                    row.ConstantItem(180).AlignRight().Column(col =>
                    {
                        col.Item().Text("EG Projetos & Consultorias").FontSize(9).FontColor(Colors.Grey.Medium);
                        col.Item().Text("CREA-SC 069829-7").FontSize(9).FontColor(Colors.Grey.Medium);
                        col.Item().Text($"Gerado em: {now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Medium);
                    });
                });

                // Content
                page.Content().PaddingTop(16).Column(col =>
                {
                    // KPIs
                    col.Item().Row(row =>
                    {
                        void Kpi(string label, string value)
                        {
                            row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                            {
                                c.Item().Text(label).FontSize(8).FontColor(Colors.Grey.Medium).Bold();
                                c.Item().Text(value).FontSize(16).Bold();
                            });
                        }
                        Kpi("Negócios", d.DealsCount.ToString());
                        Kpi("Pipeline", FormatCurrency(d.DealsValue));
                        Kpi("Pendentes", d.PendingTasks.ToString());
                        Kpi("Vencidas", d.OverdueTasks.ToString());
                        Kpi("Conversão", $"{d.ConversionRate}%");
                    });

                    col.Item().PaddingTop(16);

                    // Funnel
                    col.Item().Text("Funil comercial").FontSize(13).Bold().BorderBottom(2).BorderColor(Colors.Red.Medium).PaddingBottom(4);
                    col.Item().PaddingTop(8);

                    if (d.Funnel.Count > 0)
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2);
                                c.RelativeColumn(3);
                                c.ConstantColumn(60);
                                c.ConstantColumn(100);
                            });

                            table.Header(h =>
                            {
                                void Th(string text) => h.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text(text).FontSize(9).Bold().FontColor(Colors.Grey.Medium);
                                Th("Pipeline"); Th("Etapa"); Th("Negócios"); Th("Valor");
                            });

                            foreach (var f in d.Funnel)
                            {
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(f.Pipeline).FontSize(9).FontColor(Colors.Grey.Medium);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(f.Stage).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignCenter().Text(f.Count.ToString()).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignRight().Text(FormatCurrency(f.Value)).FontSize(9).FontColor(Colors.Red.Medium);
                            }
                        });
                    }

                    col.Item().PaddingTop(16);

                    // Overdue tasks
                    col.Item().Text("Tarefas vencidas").FontSize(13).Bold().BorderBottom(2).BorderColor(Colors.Red.Medium).PaddingBottom(4);
                    col.Item().PaddingTop(8);

                    if (d.OverdueTasksList.Count == 0)
                    {
                        col.Item().Text("Nenhuma tarefa vencida.").FontSize(9).FontColor(Colors.Grey.Medium);
                    }
                    else
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(4);
                                c.ConstantColumn(80);
                                c.ConstantColumn(60);
                            });

                            table.Header(h =>
                            {
                                void Th(string text) => h.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text(text).FontSize(9).Bold().FontColor(Colors.Grey.Medium);
                                Th("Tarefa"); Th("Prazo"); Th("Resp.");
                            });

                            foreach (var t in d.OverdueTasksList)
                            {
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(t.Title).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(t.Due).FontSize(9).FontColor(Colors.Red.Medium);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignCenter().Text($"#{t.ResponsibleId}").FontSize(9);
                            }
                        });
                    }

                    col.Item().PaddingTop(16);

                    // Finance
                    col.Item().Text("Resumo financeiro").FontSize(13).Bold().BorderBottom(2).BorderColor(Colors.Red.Medium).PaddingBottom(4);
                    col.Item().PaddingTop(8);
                    col.Item().Row(row =>
                    {
                        void FKpi(string label, string value, string color)
                        {
                            row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                            {
                                c.Item().Text(label).FontSize(8).FontColor(Colors.Grey.Medium).Bold();
                                c.Item().Text(value).FontSize(14).Bold();
                            });
                        }
                        FKpi("Receitas", FormatCurrency(d.TotalReceitas), "green");
                        FKpi("Despesas", FormatCurrency(d.TotalDespesas), "red");
                        FKpi("Saldo", FormatCurrency(d.Saldo), d.Saldo >= 0 ? "green" : "red");
                    });

                    col.Item().PaddingTop(16);

                    // Team performance
                    if (d.TeamPerformance.Count > 0)
                    {
                        col.Item().Text("Performance da equipe").FontSize(13).Bold().BorderBottom(2).BorderColor(Colors.Red.Medium).PaddingBottom(4);
                        col.Item().PaddingTop(8);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(3);
                                c.ConstantColumn(60);
                                c.ConstantColumn(100);
                                c.ConstantColumn(50);
                                c.ConstantColumn(50);
                            });

                            table.Header(h =>
                            {
                                void Th(string text) => h.Cell().Background(Colors.Grey.Lighten3).Padding(6).Text(text).FontSize(9).Bold().FontColor(Colors.Grey.Medium);
                                Th("Membro"); Th("Negócios"); Th("Valor"); Th("Feitas"); Th("Pend.");
                            });

                            foreach (var p in d.TeamPerformance)
                            {
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(p.Name).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignCenter().Text(p.Deals.ToString()).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignRight().Text(FormatCurrency(p.Value)).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignCenter().Text(p.Done.ToString()).FontSize(9);
                                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).AlignCenter().Text(p.Pending.ToString()).FontSize(9);
                            }
                        });
                    }
                });

                // Footer
                page.Footer().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(6)
                    .AlignCenter().Text("ERPlus — EG Projetos & Consultorias · Relatório gerado automaticamente")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });

        var bytes = pdf.GeneratePdf();
        return Result<byte[]>.Success(bytes);
    }

    private static string FormatCurrency(decimal value) =>
        $"R$ {value:N2}";
}

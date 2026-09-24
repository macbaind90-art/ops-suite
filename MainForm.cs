using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private readonly WebView2 webView;
        private readonly string appFolder;
        private readonly string indexPath;

        private const string AppVersion = "4.6.0";
        private const string DefaultRoot = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        private const string SettingsFileName = "suite-settings.json";
        private SuiteSettings settings = new SuiteSettings();
        private string startupHealthSeverity = "gray";
        private string startupHealthMessage = "";
        private bool openDataHealthAfterLogin = false;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, WriteIndented = true };

        public MainForm()
        {
            Text = "PWADC Security Operations Suite";
            AutoScaleMode = AutoScaleMode.Dpi;
            MinimumSize = new System.Drawing.Size(900, 600);
            Width = 1500;
            Height = 950;
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            appFolder = Path.Combine(AppContext.BaseDirectory, "app");
            indexPath = Path.Combine(appFolder, "index.html");
            webView = new WebView2 { Dock = DockStyle.Fill };
            Controls.Add(webView);
            Load += MainForm_Load;
            FormClosing += MainForm_FormClosing;
        }

        private async void MainForm_Load(object? sender, EventArgs e)
        {
            try
            {
                settings = LoadSettingsFromDisk();
                try
                {
                    EnsureFolders();
                    DailyLkgResult lkg = EnsureDailyLastKnownGoodSnapshot();
                    if (!lkg.Success) MessageBox.Show(lkg.Message, "PWADC Daily Last-Known-Good", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    SchemaInitializationResult schemaInit = EnsureLiveSchemaMetadata();
                    StartupMigrationSummary migrationSummary = ProcessStartupSchemaMigrations();
                    var startupSchemaIssues = new List<string>();
                    startupSchemaIssues.AddRange(schemaInit.Issues);
                    startupSchemaIssues.AddRange(migrationSummary.Warnings);
                    foreach (SchemaMigrationPreview blocked in migrationSummary.Blocked) startupSchemaIssues.Add(blocked.ModuleLabel + ": " + blocked.Message);
                    if (migrationSummary.Pending.Count > 0) startupSchemaIssues.Add(migrationSummary.Pending.Count + " module(s) require Administrator migration approval. Affected modules remain read-only until approved.");
                    if (startupSchemaIssues.Count > 0)
                    {
                        MessageBox.Show("Schema compatibility / migration protection found data that requires review. Unaffected modules can continue normally; protected modules will not accept incompatible writes.\r\n\r\n" + string.Join("\r\n", startupSchemaIssues), "PWADC Schema Migration", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    DataHealthSnapshot startupHealth = EvaluateDataHealth("startup", true);
                    startupHealthSeverity = startupHealth.OverallSeverity;
                    if (startupHealthSeverity == "yellow" || startupHealthSeverity == "red")
                    {
                        string affected = string.Join(", ", startupHealth.Modules.Where(x => x.Severity == "yellow" || x.Severity == "red").Select(x => x.Label));
                        startupHealthMessage = startupHealth.OverallLabel + (string.IsNullOrWhiteSpace(affected) ? "" : ": " + affected);
                        DialogResult open = MessageBox.Show("Data Health requires Administrator review. Unaffected modules remain available and no automatic restore will run.\r\n\r\n" + startupHealthMessage + "\r\n\r\nOpen Data Health & Recovery after sign-in?", "PWADC Data Health & Recovery", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
                        openDataHealthAfterLogin = open == DialogResult.Yes;
                    }
                }
                catch (Exception storageEx)
                {
                    startupHealthSeverity = "red";
                    startupHealthMessage = "Shared storage is unavailable. The suite will open with packaged fallback data in read-only operational mode. Details: " + storageEx.Message;
                    DialogResult open = MessageBox.Show(startupHealthMessage + "\r\n\r\nOpen Data Health & Recovery after an Administrator signs in?", "PWADC Shared Storage Health", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
                    openDataHealthAfterLogin = open == DialogResult.Yes;
                }
                CreateSuiteLockFile();
                await webView.EnsureCoreWebView2Async();
                webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
                if (!File.Exists(indexPath))
                {
                    MessageBox.Show("Missing app\\index.html. The suite interface was not found.", "PWADC Security Operations Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                webView.Source = new Uri(indexPath);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "PWADC Security Operations Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void MainForm_FormClosing(object? sender, FormClosingEventArgs e) => TryDeleteSuiteLockFile();
    }
}

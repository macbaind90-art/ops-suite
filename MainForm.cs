using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
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

        private const string DefaultRoot = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        private const string SettingsFileName = "suite-settings.json";
        private SuiteSettings settings = new SuiteSettings();
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, WriteIndented = true };

        public MainForm()
        {
            Text = "PWADC Security Operations Suite";
            AutoScaleMode = AutoScaleMode.Dpi;
            MinimumSize = new System.Drawing.Size(1100, 700);
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
                EnsureFolders();
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

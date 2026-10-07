using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Text.Json;

internal static class Program
{
    [STAThread]
    private static int Main()
    {
        Application.EnableVisualStyles();
        using var form = new Form { Width = 1280, Height = 900 };
        using var view = new WebView2 { Dock = DockStyle.Fill };
        form.Controls.Add(view);
        int result = 1;
        string profile = Path.Combine(Path.GetTempPath(), "PWADC-web-tests-" + Guid.NewGuid());
        form.Shown += async (_, _) =>
        {
            try
            {
                await view.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateAsync(null, profile));
                view.CoreWebView2.SetVirtualHostNameToFolderMapping("suite.test", Path.GetFullPath("app"), CoreWebView2HostResourceAccessKind.DenyCors);
                var loaded = new TaskCompletionSource<bool>();
                view.CoreWebView2.NavigationCompleted += (_, e) => loaded.TrySetResult(e.IsSuccess);
                view.CoreWebView2.Navigate("https://suite.test/index.html");
                if (!await loaded.Task.WaitAsync(TimeSpan.FromSeconds(30))) throw new Exception("Packaged page navigation failed");
                async Task Check(string expression, string description)
                {
                    string value = await view.CoreWebView2.ExecuteScriptAsync("(()=>{" + expression + "})()");
                    if (value != "true") throw new Exception(description + ": " + value);
                    Console.WriteLine("PASS " + description);
                }
                await Check("currentUser={id:'test-admin',displayName:'Test Admin',role:'Admin'};hostSessionToken='ui-test';document.getElementById('lockScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');roster={employees:[{id:1,first:'Alpha',last:'Tester',rank:'SO'}],schedule:[],audit:[]};normalizeRoster();renderShell();navigate('roster');return document.querySelectorAll('#pages > section').length===1 && !!document.getElementById('page-roster');", "Actual WebView navigation renders only the Roster");
                await Check("return !canAccessModule('tasks') && !canAccessModule('other-programs') && typeof renderTasks==='undefined' && typeof openProgram==='undefined';", "Retired modules are unavailable to Admin in the real WebView");
                await Check("const search=document.querySelector('input[oninput*=rosterSearch]');if(!search)return false;search.focus();search.value='Al';search.setSelectionRange(2,2);search.dispatchEvent(new Event('input',{bubbles:true}));const current=document.querySelector('input[oninput*=rosterSearch]');const checks={value:current.value,focused:document.activeElement===current,caret:current.selectionStart,employeeVisible:document.getElementById('page-roster').textContent.includes('Alpha')};return checks.value==='Al' && checks.focused && checks.caret===2 && checks.employeeVisible ? true : checks;", "Actual input event retains search focus, caret and filtered employee");
                await Check("closeModal();navigate('start-here');return document.querySelectorAll('#pages > section').length===1 && !!document.getElementById('page-start-here') && !document.getElementById('page-roster');", "Navigation replaces the previous page in the real DOM");
                await Check("navigate('roster');return document.querySelector('input[oninput*=rosterSearch]').value==='Al';", "Returning to Roster preserves its filter state");
                await Check("roster.schedule=[{section:'A',post:'One',days:['SO Alpha','SO Beta','None','None','None','None','None']},{section:'B',post:'Middle',days:['SO Other','None','None','None','None','None','None']},{section:'A',post:'Two',days:['SO Gamma','SO Delta','None','None','None','None','None']}];scheduleWorkspaceMode='live';const html=scheduleHtmlSnapshot();const parsed=new DOMParser().parseFromString(html,'text/html');const cells=[...parsed.querySelectorAll('.schedule-section:first-child .sch-person-cell')];return cells.length===4 && new Set(cells.map(x=>x.style.borderLeftColor)).size===4 && scheduleAdjacentColorConflicts().length===0;", "Rendered schedule groups distinguish horizontal, vertical and diagonal employees");
                result = 0;
            }
            catch (Exception error) { Console.Error.WriteLine(error); }
            finally { form.Close(); }
        };
        Application.Run(form);
        view.Dispose();
        try { Directory.Delete(profile, true); } catch { }
        return result;
    }
}

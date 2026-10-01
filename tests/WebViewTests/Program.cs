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
                await Check("currentUser={id:'test-admin',displayName:'Test Admin',role:'Admin'};hostSessionToken='ui-test';document.getElementById('lockScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');tasks={tasks:[{id:1,project:'Alpha',status:'Not Started',priority:'Normal',category:'General',nextAction:'Check gate'}],audit:[],nextId:2};normalizeTasks();renderShell();navigate('tasks');return document.querySelectorAll('#pages > section').length===1 && !!document.getElementById('page-tasks');", "Actual WebView navigation renders only the Task Tracker");
                await Check("const search=document.querySelector('input[oninput*=taskSearch]');if(!search)return false;search.focus();search.value='Al';search.setSelectionRange(2,2);search.dispatchEvent(new Event('input',{bubbles:true}));const current=document.querySelector('input[oninput*=taskSearch]');const checks={value:current.value,focused:document.activeElement===current,caret:current.selectionStart,taskVisible:document.getElementById('page-tasks').textContent.includes('Alpha')};return checks.value==='Al' && checks.focused && checks.caret===2 && checks.taskVisible ? true : checks;", "Actual input event retains search focus, caret and filtered task");
                await Check("const button=document.querySelector('button[onclick=\"openTaskPrintModal()\"]');if(!button)return false;button.click();return !!document.getElementById('tpScope') && document.querySelectorAll('.tpCol:checked').length>0;", "Actual Task Tracker button opens print controls without hidden pages");
                await Check("closeModal();navigate('start-here');return document.querySelectorAll('#pages > section').length===1 && !!document.getElementById('page-start-here') && !document.getElementById('page-tasks');", "Navigation replaces the previous page in the real DOM");
                await Check("navigate('tasks');return document.querySelector('input[oninput*=taskSearch]').value==='Al';", "Returning to Tasks preserves its filter state");
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

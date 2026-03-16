using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.ChurchRegister_ApiService>("apiservice")
    .WithHttpHealthCheck("/health");

//// Add React app
//// NOTE: Aspire.Hosting.NodeJs was deprecated in Aspire v10+; it is now Aspire.Hosting.JavaScript.
////       The AddNpmApp() API has been replaced — see AddJavaScriptApp() or the new npm/yarn/pnpm helpers.
////       Re-add CommunityToolkit.Aspire.Hosting.NodeJS.Extensions when re-enabling this block
////       (ensure the version is compatible with the Aspire version in use).
//var reactApp = builder.AddNpmApp("react-app", "../ChurchRegister.React")
//    .WithHttpEndpoint(env: "PORT")
//    .WithExternalHttpEndpoints()
//    .PublishAsDockerFile();

//// For local development, use dev script; for production, use preview after build
//if (builder.Environment.IsDevelopment())
//{
//    reactApp.WithArgs("run", "dev");
//}
//else
//{
//    reactApp.WithArgs("run", "build").WithArgs("run", "preview");
//}

//// Set up environment variables for the React app to connect to API
//reactApp.WithEnvironment("VITE_API_BASE_URL", apiService.GetEndpoint("http"));

builder.Build().Run();


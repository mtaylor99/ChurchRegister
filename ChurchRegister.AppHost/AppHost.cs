using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.ChurchRegister_ApiService>("apiservice")
    .WithHttpHealthCheck("/health");

//// Add React app
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

# Use Cases Pattern

This directory contains use case implementations following Clean Architecture principles for the ChurchRegister API service.

## Overview

Use cases represent the business logic of the application and are independent of external concerns like web frameworks, databases, or UI. They encapsulate the application-specific business rules and orchestrate the flow of data between entities and external interfaces.

## Directory Structure

```
UseCase/
├── Security/
│   ├── Authentication/
│   │   ├── Login/
│   │   │   ├── ILoginUseCase.cs
│   │   │   └── LoginUseCase.cs
│   │   ├── Logout/
│   │   │   ├── ILogoutUseCase.cs
│   │   │   └── LogoutUseCase.cs
│   │   ├── GetCurrentUser/
│   │   │   ├── IGetCurrentUserUseCase.cs
│   │   │   └── GetCurrentUserUseCase.cs
│   │   ├── RefreshToken/
│   │   ├── ChangePassword/
│   │   └── UpdateProfile/
│   └── RevokeUserTokens/
├── ChurchMembers/
│   └── (To be implemented)
├── Attendance/
│   └── (To be implemented)
├── Contributions/
│   └── (To be implemented)
├── Dashboard/
│   └── (To be implemented)
├── IUseCase.cs (Base interfaces)
└── README.md (This file)
```

## Base Interfaces

### IUseCase<TRequest, TResponse>

For use cases that accept a request object and return a response:

```csharp
public interface IUseCase<TRequest, TResponse>
{
    Task<TResponse> ExecuteAsync(TRequest request, CancellationToken cancellationToken = default);
}
```

### IUseCase<TResponse>

For use cases that only return a response (no request body):

```csharp
public interface IUseCase<TResponse>
{
    Task<TResponse> ExecuteAsync(CancellationToken cancellationToken = default);
}
```

## Creating a New Use Case

### 1. Create the Use Case Interface

```csharp
using ChurchRegister.ApiService.Models.YourDomain;

namespace ChurchRegister.ApiService.UseCase.YourDomain.YourAction;

public interface IYourActionUseCase : IUseCase<YourRequest, YourResponse>
{
}
```

### 2. Implement the Use Case

```csharp
using ChurchRegister.ApiService.Models.YourDomain;

namespace ChurchRegister.ApiService.UseCase.YourDomain.YourAction;

public class YourActionUseCase : IYourActionUseCase
{
    private readonly IYourService _yourService;

    public YourActionUseCase(IYourService yourService)
    {
        _yourService = yourService;
    }

    public async Task<YourResponse> ExecuteAsync(YourRequest request, CancellationToken cancellationToken = default)
    {
        // Validate input
        if (string.IsNullOrEmpty(request.RequiredField))
        {
            throw new ArgumentException("RequiredField is required");
        }

        // Execute business logic
        var result = await _yourService.DoSomethingAsync(request.RequiredField);

        // Return response
        return new YourResponse
        {
            Message = "Success",
            Data = result
        };
    }
}
```

### 3. Register in DI Container (Program.cs)

```csharp
builder.Services.AddScoped<IYourActionUseCase, YourActionUseCase>();
```

### 4. Use in Controller

```csharp
public class YourEndpoint : Endpoint<YourRequest, YourResponse>
{
    private readonly IYourActionUseCase _useCase;

    public YourEndpoint(IYourActionUseCase useCase)
    {
        _useCase = useCase;
    }

    public override async Task HandleAsync(YourRequest request, CancellationToken ct)
    {
        try
        {
            var response = await _useCase.ExecuteAsync(request, ct);
            await SendOkAsync(response, ct);
        }
        catch (ArgumentException ex)
        {
            ThrowError(ex.Message, 400);
        }
        catch (UnauthorizedAccessException ex)
        {
            ThrowError(ex.Message, 401);
        }
    }
}
```

## Naming Conventions

### Folders

- Use PascalCase for folder names
- Organize by domain/feature (e.g., `Authentication`, `Members`, `Events`)
- Create subfolders for each action (e.g., `Login`, `Register`, `UpdateProfile`)

### Files

- Interface: `I{Action}UseCase.cs` (e.g., `ILoginUseCase.cs`)
- Implementation: `{Action}UseCase.cs` (e.g., `LoginUseCase.cs`)

### Classes

- Interface: `I{Action}UseCase`
- Implementation: `{Action}UseCase`

## Error Handling

Use cases should throw appropriate exceptions for different error scenarios:

- `ArgumentException` - For validation errors (400 Bad Request)
- `UnauthorizedAccessException` - For authentication/authorization errors (401 Unauthorized)
- `InvalidOperationException` - For business rule violations (400 Bad Request)
- `NotImplementedException` - For features not yet implemented (501 Not Implemented)

Controllers should catch these exceptions and convert them to appropriate HTTP responses.

## Best Practices

1. **Single Responsibility**: Each use case should handle only one business operation
2. **Dependency Injection**: Inject only the services you need
3. **Async/Await**: Always use async operations for I/O bound work
4. **Validation**: Validate inputs at the use case level
5. **Error Handling**: Use meaningful exceptions with clear messages
6. **Testing**: Write unit tests for each use case
7. **Documentation**: Document complex business logic
8. **Immutability**: Prefer immutable data structures where possible

## Use Case vs Service Responsibilities

### Use Case Responsibilities

- **Input Validation**: Validate business rules on incoming requests
- **Business Logic**: Orchestrate domain operations and workflows
- **Authorization**: Check user permissions for the operation
- **Orchestration**: Coordinate multiple services/repositories
- **Transaction Management**: Handle complex multi-step operations
- **Error Handling**: Transform technical exceptions into business errors

### Service Responsibilities

- **Data Access**: CRUD operations against database
- **External Integration**: Call external APIs (email, payment, etc.)
- **Data Transformation**: Convert between entities and DTOs
- **Query Building**: Complex queries with EF Core
- **Caching**: Data caching strategies (if applicable)

### Endpoint Responsibilities

- **Routing**: Map HTTP routes to use cases
- **HTTP Concerns**: Handle HTTP-specific details (status codes, headers)
- **Request Binding**: Bind HTTP requests to DTOs
- **Response Formatting**: Format use case results as HTTP responses
- **Authentication**: Validate JWT tokens (handled by FastEndpoints)

## Testing Use Cases

Use cases are ideal candidates for unit testing since they contain pure business logic:

```csharp
[Test]
public async Task LoginUseCase_ValidCredentials_ReturnsLoginResponse()
{
    // Arrange
    var mockSignInManager = new Mock<SignInManager<ChurchRegisterWebUser>>();
    var mockUserManager = new Mock<UserManager<ChurchRegisterWebUser>>();
    var mockConfiguration = new Mock<IConfiguration>();

    var useCase = new LoginUseCase(mockSignInManager.Object, mockUserManager.Object, mockConfiguration.Object);
    var request = new LoginRequest { Email = "test@example.com", Password = "password" };

    // Act
    var result = await useCase.ExecuteAsync(request);

    // Assert
    Assert.That(result.Message, Is.EqualTo("Login successful"));
}
```

## Examples

See the following folders for complete examples:

- **Security/Authentication**: Login, Logout, GetCurrentUser, RefreshToken, ChangePassword, UpdateProfile
- **Security/RevokeUserTokens**: Token management

This pattern should be replicated for other domains:

- **ChurchMembers**: Create, Update, Get, Delete member operations
- **Attendance**: Event and attendance tracking operations
- **Contributions**: HSBC statement upload, envelope batches
- **Dashboard**: Statistics and analytics

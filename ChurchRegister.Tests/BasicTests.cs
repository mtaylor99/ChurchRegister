using ChurchRegister.ApiService.Models;
using ChurchRegister.ApiService.Models.ChurchMembers;
using ChurchRegister.ApiService.Models.Security;
using ChurchRegister.ApiService.Models.Attendance;
using ChurchRegister.ApiService.Models.Dashboard;
using FluentAssertions;
using Xunit;

namespace ChurchRegister.ApiService.Tests;

/// <summary>
/// Basic tests to validate core model functionality and test infrastructure
/// </summary>
public class BasicTests
{
    [Fact]
    public void UserGridQuery_DefaultValues_ShouldBeValid()
    {
        // Arrange & Act
        var query = new UserGridQuery();

        // Assert
        query.Page.Should().Be(1);
        query.PageSize.Should().Be(25);
        query.SearchTerm.Should().BeNullOrEmpty();
        query.StatusFilter.Should().BeNull();
        query.RoleFilter.Should().BeNullOrEmpty();
        query.SortBy.Should().Be("FirstName");
        query.SortDirection.Should().Be("asc");
    }

    [Fact]
    public void UserGridQuery_WithCustomValues_ShouldRetainValues()
    {
        // Arrange & Act
        var query = new UserGridQuery
        {
            Page = 2,
            PageSize = 50,
            SearchTerm = "test",
            RoleFilter = "Admin",
            SortBy = "LastName",
            SortDirection = "desc"
        };

        // Assert
        query.Page.Should().Be(2);
        query.PageSize.Should().Be(50);
        query.SearchTerm.Should().Be("test");
        query.RoleFilter.Should().Be("Admin");
        query.SortBy.Should().Be("LastName");
        query.SortDirection.Should().Be("desc");
    }

    [Fact]
    public void PagedResult_DefaultConstruction_ShouldHaveValidDefaults()
    {
        // Arrange & Act
        var result = new PagedResult<string>();

        // Assert
        result.Items.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.CurrentPage.Should().Be(0);
        result.PageSize.Should().Be(0);
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public void PagedResult_WithData_ShouldRetainProperties()
    {
        // Arrange
        var items = new[] { "item1", "item2", "item3" };

        // Act
        var result = new PagedResult<string>
        {
            Items = items,
            CurrentPage = 1,
            PageSize = 10,
            TotalCount = 3
        };

        // Assert
        result.Items.Should().Equal(items);
        result.CurrentPage.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalCount.Should().Be(3);
        result.HasNextPage.Should().BeFalse();
        result.HasPreviousPage.Should().BeFalse();
    }

    [Theory]
    [InlineData(1, 10, 25, false, true)]  // First page, has next
    [InlineData(2, 10, 25, true, true)]   // Middle page, has both
    [InlineData(3, 10, 25, true, false)]  // Last page, has previous
    [InlineData(1, 25, 25, false, false)] // All items on one page
    public void PagedResult_NavigationProperties_ShouldCalculateCorrectly(
        int currentPage, int pageSize, int totalCount, 
        bool expectedHasPrevious, bool expectedHasNext)
    {
        // Arrange & Act
        var result = new PagedResult<string>
        {
            CurrentPage = currentPage,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        // Assert
        result.HasPreviousPage.Should().Be(expectedHasPrevious);
        result.HasNextPage.Should().Be(expectedHasNext);
    }

    [Fact]
    public void CreateUserRequest_Validation_ShouldWork()
    {
        // Arrange & Act
        var request = new CreateUserRequest
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Assert
        request.Email.Should().Be("test@example.com");
        request.FirstName.Should().Be("John");
        request.LastName.Should().Be("Doe");
    }

    [Fact]
    public void UpdateUserRequest_Validation_ShouldWork()
    {
        // Arrange & Act
        var request = new UpdateUserRequest
        {
            UserId = "user-123",
            FirstName = "Jane",
            LastName = "Smith",
            PhoneNumber = "123-456-7890",
            JobTitle = "Manager",
            Roles = new[] { "User", "Admin" }
        };

        // Assert
        request.UserId.Should().Be("user-123");
        request.FirstName.Should().Be("Jane");
        request.LastName.Should().Be("Smith");
        request.PhoneNumber.Should().Be("123-456-7890");
        request.JobTitle.Should().Be("Manager");
        request.Roles.Should().Equal("User", "Admin");
    }
}
namespace ERPlus.Shared.Contracts;

public interface ICurrentUser
{
    int Id { get; }
    string Name { get; }
    string Email { get; }
    string Role { get; }
    bool IsAuthenticated { get; }
}

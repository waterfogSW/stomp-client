import styled from 'styled-components';

export const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  font-size: ${({ theme }) => theme.font.size.medium};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: background-color 0.2s;

  ${({ theme, variant }) =>
  variant === 'primary'
    ? `
    background-color: ${theme.components.button.primary.background};
    color: ${theme.components.button.primary.text};
    &:hover {
      background-color: ${theme.components.button.primary.hoverBackground};
    }
  `
    : `
    background-color: ${theme.components.button.secondary.background};
    color: ${theme.components.button.secondary.text};
    &:hover {
      background-color: ${theme.components.button.secondary.hoverBackground};
    }
  `}
`;

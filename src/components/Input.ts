import styled from 'styled-components';
import { Theme } from '@/styles/theme';

export const Input = styled.input<{ theme: Theme }>`
  padding: ${({ theme }) => theme.spacing.small};
  font-size: ${({ theme }) => theme.font.size.medium};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 1px solid ${({ theme }) => theme.components.input.border};
  background-color: ${({ theme }) => theme.components.input.background};
  color: ${({ theme }) => theme.components.input.text};

  &::placeholder {
    color: ${({ theme }) => theme.components.input.placeholderText};
  }
`;

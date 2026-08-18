import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from 'react';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const InputWrapper = styled.div<ThemedProps>`
  align-items: center;
  border-bottom: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
`;

const SearchIcon = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent9};
  font-size: 1.25rem;
`;

const Input = styled.input<ThemedProps>`
  background: transparent;
  border: none;
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  flex: 1;
  font-size: 1.1rem;
  outline: none;

  &::placeholder {
    color: ${({ theme }: ThemedProps) => theme.greyscale.accent8};
  }
`;

type SpotlightInputProps = {
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
};

const SpotlightInput = ({
  onChange,
  onSubmit,
  value,
}: SpotlightInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <InputWrapper>
      <SearchIcon>&#x1F50D;</SearchIcon>
      <Input
        ref={inputRef}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ticket name or Jira key..."
        value={value}
      />
    </InputWrapper>
  );
};

export default SpotlightInput;

import React from "react";
import styled from "styled-components";
import { AppColors } from "../../util/constants";

export const PubInput = styled.input`
  border: 1px solid ${AppColors.Gray40};
  border-radius: ${({ label }) => (label ? "4px 0 0 4px" : "4px")};
  box-sizing: border-box;
  color: #444;
  display: ${({ block }) => (block ? "block" : "inline-block")};
  font-size: 13px;
  line-height: 1em;
  margin: 0;
  padding: 3px 6px;
  vertical-align: middle;
  width: ${({ block }) => (block ? "100%" : "auto")};
  outline: none;

  &:focus {
    box-shadow: inset 0 1px 3px #eee, 0 0 0 2px #c8c7c8;

    + span {
      box-shadow: inset 0 1px 3px #eee, 0 0 0 2px #c8c7c8;
    }
  }
`;

const FormInputContainer = styled.div`
  flex: 1;
`;

const FormInputLabel = styled.label`
  display: block;
  font-size: 0.75em;
  font-weight: 500;
  color: #555;
  margin: 0.25em 0 0;
`;

const PubInputLabel = styled.span`
  background: #f0f0f0;
  border-right: 1px ${AppColors.Gray40} solid;
  border-top: 1px ${AppColors.Gray40} solid;
  border-bottom: 1px ${AppColors.Gray40} solid;
  border-radius: 0 4px 4px 0;
  font-weight: 600;
  font-size: 11px;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
`;

export const FormGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0 0;
  div {
    margin: 0;
  }
  div:first-child {
    margin: 0;
  }
  div:last-child {
    margin: 0 0 0 10px;
  }
  div:only-child {
    margin: 0;
  }
`;

export const RadioFormGroup = styled(FormGroup)`
  justify-content: flex-start;
  align-items: center;
  margin: 15px 0 0;

  input {
    margin: 0 10px 0 0;
  }

  label {
    font-size: 0.95em;
  }
`;

const PubInputGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

type Props = {
  onChange: Function,
  name: string,
  value?: string,
  displayName?: string,
  label?: string,
  marginBottom?: string,
  marginRight?: string,
  autoComplete?: string,
  type: string,
};
export const FormInput = ({
  onChange,
  name,
  value,
  displayName,
  marginBottom,
  marginRight,
  autoComplete,
  label,
  type,
}: Props) => (
  <FormInputContainer style={{ marginBottom, marginRight }}>
    <PubInputGroup>
      <PubInput
        block
        label={label}
        id={name}
        onChange={onChange}
        name={name}
        autoComplete={autoComplete}
        value={value}
        type={type}
      />
      {label && <PubInputLabel>{label}</PubInputLabel>}
    </PubInputGroup>
    <FormInputLabel htmlFor={name}>{displayName}</FormInputLabel>
  </FormInputContainer>
);

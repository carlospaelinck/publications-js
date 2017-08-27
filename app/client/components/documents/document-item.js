import React from "react"
import { format as formatDate } from "fecha"
import { Text } from "../ui/text"
import { AppColors } from "../../util/constants"
import styled from "styled-components"

const DocumentItemContent = styled.li`
  cursor: default;
  user-select: none;
  text-align: center;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  padding: 0.85em 1em;
  background: ${({ selected }) => selected ? AppColors.Active : "transparent"};
  box-shadow: 0 1px 0 ${({ selected }) => selected ? AppColors.ActiveDark : AppColors.Border};
`

const formattedDateString = date => {
  const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  if (date < oneWeekAgo) {
    return formatDate(date, "MMM D, YYYY, h:mm A")
  }
  return formatDate(date, "dddd, h:mm A")
}

export const DocumentItem = ({
  selectedDocument, doc, onClick
}) => {
  const selected = !!selectedDocument && selectedDocument.id === doc.id
  const lastModifiedDate = new Date(doc.lastModified)

  return (
    <DocumentItemContent
      selected={selected}
      onClick={onClick}
    >
      <Text
        white={selected}
        size="0.95em"
        mb="0.25em"
      >
        { doc.name }
      </Text>
      <Text
        white={selected}
        size="0.825em"
      >
        { formattedDateString(lastModifiedDate) }
      </Text>
    </DocumentItemContent>
  )
}

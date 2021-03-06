import * as React from "react";
import produce from "immer";
import get from "lodash/fp/get";
import flowRight from "lodash/fp/flowRight";
import cloneDeep from "clone-deep";
import { pipe, take, toPromise } from "wonka";
import gql from "graphql-tag";
import constate from "constate";

import {
  addEditorStateToDocument,
  addEditorStateToObject,
  documentsWithEditorState,
  duplicateShape,
} from "../util/documents";
import shortid from "shortid";
import { PubAppState } from "./app-state";
import {
  PubDocument,
  PubPage,
  PubShape,
  PubShapeChanges,
  PubShapeType,
  PubUser,
} from "../types/pub-objects";
import {
  ClipboardAction,
  LayerMutationDelta,
  SaveDocumentMutationResponse,
  DocumentsQuery,
  CurrentUserQuery,
  DeleteDocumentMutationResponse,
  SaveDocumentMutation,
  DeleteDocumentMutation,
  LoginMutationResponse,
  LoginMutation,
  CreateUserMutationResponse,
  CreateUserMutation,
} from "../types/data";
import { useQuery, useMutation, Client } from "urql";
import {
  currentUserQuery,
  documentsQuery,
  saveDocumentMutation,
  deleteDocumentMutation,
  loginMutation,
  createUserMutation,
  documentQuery,
} from "../queries";
import { packageDocument } from "../util/package-document";
import { navigate } from "@reach/router";

type useAppStateFn = (options: { client: Client }) => PubAppState;

const useAppState: useAppStateFn = ({ client }) => {
  const [
    { data: currentUserData, fetching: userFetching },
    refetchCurrentUser,
  ] = useQuery<CurrentUserQuery>({
    query: currentUserQuery,
    requestPolicy: "network-only",
  });
  const [{ data: docsData }, refreshDocsData] = useQuery<DocumentsQuery>({
    query: documentsQuery,
    requestPolicy: "network-only",
  });
  const [, saveDocumentAction] = useMutation<
    SaveDocumentMutationResponse,
    SaveDocumentMutation
  >(saveDocumentMutation);
  const [, deleteDocumentAction] = useMutation<
    DeleteDocumentMutationResponse,
    DeleteDocumentMutation
  >(deleteDocumentMutation);
  const [, login] = useMutation<LoginMutationResponse, LoginMutation>(
    loginMutation
  );
  const [, createUser] = useMutation<
    CreateUserMutationResponse,
    CreateUserMutation
  >(createUserMutation);

  const documents: PubDocument[] | null = React.useMemo(
    () => documentsWithEditorState(get("documents")(docsData)),
    [docsData]
  );

  const user: PubUser | null = get("currentUser")(currentUserData) || null;
  const dataLoaded = !!documents;
  const [
    currentDocument,
    setCurrentDocument,
  ] = React.useState<PubDocument | null>(null);
  const [
    selectedDocumentItem,
    setSelectedDocumentItem,
  ] = React.useState<PubDocument | null>(null);

  const [selectedObject, setSelectedObject] = React.useState<PubShape | null>(
    null
  );
  const [
    clipboardContents,
    setClipboardContents,
  ] = React.useState<PubShape | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [newDocumentModalVisible, setNewDocumentModalVisible] = React.useState(
    false
  );
  const [
    openDocumentModalVisible,
    setOpenDocumentModalVisible,
  ] = React.useState(false);
  const [startModalVisible, setStartModalVisible] = React.useState(false);
  const [newAccountModalVisible, setNewAccountModalVisible] = React.useState(
    false
  );
  const [aboutModalVisible, setAboutModalVisible] = React.useState(false);
  const [loginModalVisible, setLoginModalVisible] = React.useState(false);
  const [layersPanelVisible, setLayersPanelVisible] = React.useState(false);
  const [saveDialogVisible, setSaveDialogVisible] = React.useState(false);
  const [
    deleteDocumentDialogVisible,
    setDeleteDocumentDialogVisible,
  ] = React.useState(false);

  const getDocument = React.useCallback(
    async (id: string) => {
      try {
        const { data } = await pipe(
          client.executeQuery({
            query: gql(documentQuery),
            variables: { id },
            key: 0,
          }),
          take(1),
          toPromise
        );
        flowRight(
          setCurrentDocument,
          addEditorStateToDocument
        )(data.document);
      } catch (e) {
        console.error(e);
      }
      return;
    },
    [client]
  );

  const saveDocument = React.useCallback(
    async (sender?: PubDocument) => {
      if (!currentDocument && !sender) {
        return;
      }
      const documentToSave = packageDocument(sender || currentDocument);
      return saveDocumentAction({ document: documentToSave });
    },
    [currentDocument, saveDocumentAction]
  );

  const updateSelectedObject = React.useCallback(
    (sender: PubShapeChanges) => {
      if (sender === null) {
        setSelectedObject(null);
        return;
      }
      const updatedSelectedObj: PubShape = { ...selectedObject, ...sender };
      const updatedDocument = produce(currentDocument, draftDocument => {
        const idx = currentDocument.pages[0].shapes.findIndex(
          shape => updatedSelectedObj.id === shape.id
        );
        draftDocument.pages[0].shapes[idx] = updatedSelectedObj;
      });
      setSelectedObject(updatedSelectedObj);
      setCurrentDocument(updatedDocument);
    },
    [selectedObject, currentDocument]
  );

  const updateCurrentPage = React.useCallback(
    (sender: Partial<PubPage>) => {
      if (sender === null || !currentDocument) {
        return;
      }
      const updatedDocument = produce(currentDocument, draftDocument => {
        draftDocument.pages[0] = { ...draftDocument.pages[0], ...sender };
      });
      setCurrentDocument(updatedDocument);
    },
    [currentDocument]
  );

  const updateCurrentDocument = React.useCallback(
    (sender: Partial<PubDocument>) => {
      if (sender === null || !currentDocument) {
        return;
      }
      setCurrentDocument({ ...currentDocument, ...sender });
    },
    [currentDocument]
  );

  const logout = React.useCallback(async () => {
    await saveDocument();
    window.localStorage.removeItem("authorization_token");
    setSelectedObject(null);
    setLayersPanelVisible(false);
    setZoom(1);
    refetchCurrentUser({ skipCache: true });
    refreshDocsData();
    navigate("/");
    setCurrentDocument(null);
  }, [refetchCurrentUser, refreshDocsData, saveDocument]);

  const addObject = React.useCallback(
    (sender: PubShape) => {
      const newObject = produce(sender, draftNewObject => {
        draftNewObject.z = currentDocument.pages[0].shapes.length + 1;
        draftNewObject.id = shortid.generate();
      });
      const updatedDocument = produce(currentDocument, draftDocument => {
        draftDocument.pages[0].shapes.push(newObject);
      });
      setSelectedObject(newObject);
      setCurrentDocument(updatedDocument);
    },
    [setSelectedObject, setCurrentDocument, currentDocument]
  );

  const adjustObjectLayer = React.useCallback(
    (delta: LayerMutationDelta) => {
      const { source, destination } = delta;
      if (!source || !destination || !currentDocument) {
        return;
      }
      const doc = produce(currentDocument, draftState => {
        const fromIndex = source.index;
        const toIndex = destination.index;
        const sortedObjects = Array.from(currentDocument.pages[0].shapes);
        const [adjustedShape] = sortedObjects.splice(fromIndex, 1);
        sortedObjects.splice(toIndex, 0, adjustedShape);
        const shapes = sortedObjects.map((shape, index) => ({
          ...shape,
          z: index + 1,
        }));
        const selectedObject = shapes.find(
          shape => shape.id === adjustedShape.id
        );
        draftState.pages[0].shapes = shapes;
        setSelectedObject(selectedObject);
      });
      setCurrentDocument(doc);
    },
    [currentDocument, setCurrentDocument, setSelectedObject]
  );

  const deleteObject = React.useCallback(() => {
    if (!selectedObject || !currentDocument) {
      return;
    }
    const doc = produce(currentDocument, draftState => {
      draftState.pages[0].shapes = currentDocument.pages[0].shapes
        .filter(shape => shape.id !== selectedObject.id)
        .map(shape => {
          if (shape.z > selectedObject.z) {
            shape.z -= 1;
          }
          return shape;
        });
    });
    setSelectedObject(null);
    setCurrentDocument(doc);
  }, [setSelectedObject, setCurrentDocument, currentDocument, selectedObject]);

  const handleCreateNewDocument = React.useCallback(
    async (sender: { name: string; width: number; height: number }) => {
      const payload = {
        name: sender.name,
        pages: [
          {
            pageNumber: 1,
            width: sender.width,
            height: sender.height,
            shapes: [],
          },
        ],
      };
      if (user) {
        try {
          const { data } = await saveDocumentAction({ document: payload });
          await refreshDocsData({ requestPolicy: "network-only" });
          return data.saveDocument;
        } catch (e) {
          return null;
        }
      }
    },
    [refreshDocsData, saveDocumentAction, user]
  );

  const deleteDocument = React.useCallback(
    async (id: string | number) => {
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument(null);
        setSelectedObject(null);
      }
      const response = await deleteDocumentAction({ id });
      return response.data;
    },
    [currentDocument, deleteDocumentAction]
  );

  const handleClipboardAction = React.useCallback(
    (action: ClipboardAction) => {
      if (!currentDocument) {
        return;
      }
      if (action === ClipboardAction.Copy && selectedObject) {
        const copiedObj = duplicateShape(selectedObject);
        setClipboardContents(copiedObj);
      } else if (action === ClipboardAction.Cut && selectedObject) {
        const cutObj = duplicateShape(selectedObject);
        setClipboardContents(cutObj);
        deleteObject();
      } else if (action === ClipboardAction.Paste && clipboardContents) {
        const newObject = {
          ...cloneDeep(clipboardContents),
          z: currentDocument.pages[0].shapes.length + 1,
          id: shortid.generate(),
        };
        if (newObject.type === PubShapeType.Text) {
          addEditorStateToObject(newObject);
        }
        const updatedDocument = produce(currentDocument, draftDocument => {
          draftDocument.pages[0].shapes.push(newObject);
        });
        setSelectedObject(newObject);
        setCurrentDocument(updatedDocument);
      }
    },
    [currentDocument, selectedObject, clipboardContents, deleteObject]
  );

  const actions = {
    setAboutModalVisible,
    setLoginModalVisible,
    setLayersPanelVisible,
    setStartModalVisible,
    setCurrentDocument,
    setNewAccountModalVisible,
    setNewDocumentModalVisible,
    setOpenDocumentModalVisible,
    setSaveDialogVisible,
    setDeleteDocumentDialogVisible,
    setSelectedDocumentItem,
    setSelectedObject,
    setZoom,
    getDocument,
    saveDocument,
    deleteDocument,
    addObject,
    deleteObject,
    updateSelectedObject,
    updateCurrentPage,
    updateCurrentDocument,
    adjustObjectLayer,
    handleCreateNewDocument,
    handleClipboardAction,
    refreshDocsData,
    login,
    createUser,
    refetchCurrentUser,
    logout,
  };

  const state = {
    aboutModalVisible,
    clipboardContents,
    currentDocument,
    documents,
    dataLoaded,
    selectedObject,
    selectedDocumentItem,
    zoom,
    user,
    newDocumentModalVisible,
    openDocumentModalVisible,
    loginModalVisible,
    startModalVisible,
    newAccountModalVisible,
    saveDialogVisible,
    deleteDocumentDialogVisible,
    layersPanelVisible,
    userFetching,
  };

  return {
    actions,
    ...state,
  };
};

const [AppStateProvider, useAppStateContext] = constate(useAppState);
export { AppStateProvider, useAppStateContext };

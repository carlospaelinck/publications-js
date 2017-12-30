package com.carlospaelinck.controllers;

import com.carlospaelinck.domain.Document;
import com.carlospaelinck.security.UserDetails;
import com.carlospaelinck.services.DocumentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.inject.Inject;
import java.util.List;

@RestController
@RequestMapping(value = "/documents")
public class DocumentController {
  @Inject
  DocumentService documentService;

  @RequestMapping(method = RequestMethod.GET)
  List<Document> list(@AuthenticationPrincipal UserDetails userDetails) {
    return documentService.findAllByUser(userDetails.getUser());
  }

  @RequestMapping(method = RequestMethod.POST)
  Document create(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Document document) {
    document.setUser(userDetails.getUser());
    return documentService.create(document);
  }

  @RequestMapping(value = "/{documentId}", method = RequestMethod.GET)
  Document get(@PathVariable("documentId") String documentId) {
    return documentService.get(documentId);
  }

  @RequestMapping(value = "/{documentId}", method = RequestMethod.DELETE)
  void delete(@PathVariable("documentId") String documentId) {
    documentService.delete(documentId);
  }

  @RequestMapping(value = "/{documentId}", method = RequestMethod.PUT)
  Document update(@AuthenticationPrincipal UserDetails userDetails, @PathVariable("documentId") String documentId, @RequestBody Document document) {
    document.setId(documentId);
    document.setUser(userDetails.getUser());
    return documentService.update(document);
  }

  @RequestMapping(value = "/{documentId}/pdf", method = RequestMethod.GET)
  ResponseEntity<HttpStatus> pdf() {
    return new ResponseEntity<>(HttpStatus.GONE);
  }
}
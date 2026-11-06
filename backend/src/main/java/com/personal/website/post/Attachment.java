package com.personal.website.post;

import jakarta.persistence.Embeddable;

@Embeddable
public class Attachment {
    private String filename;
    private String url;
    private String contentType;
    private long size;

    protected Attachment() {
    }

    public Attachment(String filename, String url, String contentType, long size) {
        this.filename = filename;
        this.url = url;
        this.contentType = contentType;
        this.size = size;
    }

    public String getFilename() {
        return filename;
    }

    public String getUrl() {
        return url;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSize() {
        return size;
    }
}

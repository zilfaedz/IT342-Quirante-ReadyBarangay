package edu.cit.quirante.readybarangay.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.io.PrintWriter;
import java.io.FileWriter;
import java.util.Date;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        try (PrintWriter pw = new PrintWriter(new FileWriter("backend_error.log", true))) {
            pw.println("====== " + new Date().toString() + " ======");
            pw.println(e.getMessage());
            e.printStackTrace(pw);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        e.printStackTrace();
        return ResponseEntity.status(500)
                .body(Map.of("message", "Internal server error: " + e.getMessage(), "success", false));
    }
}

package Main;

import java.awt.Robot;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class InputWorker {
    public static void main(String[] args) {
        try {
            Robot robot = new Robot();
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            String line;

            System.out.println("WORKER_READY");

            while ((line = reader.readLine()) != null) {
                line = line.trim().toUpperCase();
                if (line.isEmpty()) continue;

                if (line.equals("EXIT")) {
                    break;
                }

                switch (line) {
                    case "PRESS_A":
                        robot.keyPress(65);
                        System.out.println("A DOWN");
                        break;
                    case "RELEASE_A":
                        robot.keyRelease(65); 
                        System.out.println("A UP");
                        break;
                    case "PRESS_D":
                        robot.keyPress(68);
                        System.out.println("D DOWN");
                        break;
                    case "RELEASE_D":
                        robot.keyRelease(68); 
                        System.out.println("D UP");
                        break;
                    case "RELEASE_ALL":
                        robot.keyRelease(65);
                        robot.keyRelease(68);
                        System.out.println("ALL RELEASED");
                        break;
                }
            }
        } catch (Exception e) {
            System.err.println("JAVA_ERROR: " + e.getMessage());
        }
    }
}
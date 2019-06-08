package com.brennaswitzer.cookbook.payload;

import com.brennaswitzer.cookbook.domain.Task;
import com.fasterxml.jackson.annotation.JsonInclude;

import javax.validation.constraints.NotBlank;
import java.util.LinkedList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class TaskInfo {

    public static TaskInfo fromTask(Task task) {
        TaskInfo info = new TaskInfo();
        info.id = task.getId();
        info.name = task.getName();
        if (task.isSubtask()) {
            info.parentId = task.getParent().getId();
        }
        if (task.hasSubtasks()) {
            info.subtaskIds = new long[task.getSubtaskCount()];
            int i = 0;
            for (Task t : task.getOrderedSubtasksView()) {
                info.subtaskIds[i++] = t.getId();
            }
        }
        return info;
    }

    public static List<TaskInfo> fromTasks(Iterable<Task> tasks) {
        List<TaskInfo> result = new LinkedList<>();
        tasks.forEach(t ->
                result.add(fromTask(t))
        );
        return result;
    }

    private Long id;

    @NotBlank
    private String name;

    private Long parentId;

    private long[] subtaskIds;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public long[] getSubtaskIds() {
        return subtaskIds;
    }

    public void setSubtaskIds(long[] subtaskIds) {
        this.subtaskIds = subtaskIds;
    }

    public boolean hasSubtasks() {
        return subtaskIds != null && subtaskIds.length > 0;
    }

}
